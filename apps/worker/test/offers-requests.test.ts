/**
 * REQUEST -> OFFER -> CHAT: an I NEED request receives an offer, the chat
 * opens as soon as the offer is sent, both parties talk in the same thread,
 * and accepting keeps that thread and closes the request. Also covers the
 * ownership rules (recipient derived server-side, private conversations,
 * sender-scoped image keys).
 */
import { newId, schema } from '@pandam/database';
import { type AuthSession, type MarketItem, type OfferView } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
let catId = '';
beforeEach(async () => {
  ctx = await makeTestDb();
  catId = newId('category');
  await ctx.db.insert(schema.categories).values([{ id: catId, name: 'Technology', slug: 'technology' }]);
});
afterEach(() => ctx.close());

type Ok<T> = { ok: true; data: T };
type App = ReturnType<TestDb['makeApp']>;
const json = <T>(r: Response) => r.json() as Promise<T>;
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

async function newUser(app: App, name: string): Promise<AuthSession> {
  const res = await app.request(
    '/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `${name.toLowerCase()}${Math.random().toString(36).slice(2)}@example.com`,
        password: 'a valid pw 12',
        displayName: name,
      }),
    },
    testEnv,
  );
  return (await json<Ok<AuthSession>>(res)).data;
}

async function post(app: App, token: string, path: string, body: unknown) {
  return app.request(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json', ...bearer(token) }, body: JSON.stringify(body) },
    testEnv,
  );
}
const get = (app: App, token: string, path: string) => app.request(path, { headers: bearer(token) }, testEnv);

async function create(app: App, token: string, kind: 'listings' | 'needs', title: string) {
  const res = await post(app, token, `/api/v1/${kind}`, {
    categoryId: catId,
    type: 'service',
    title,
    description: 'I need beautiful screenshots for my website.',
    status: 'published',
  });
  expect(res.status).toBe(201);
  return (await json<Ok<{ item: MarketItem }>>(res)).data.item;
}

describe('request -> offer -> chat', () => {
  it('runs the whole journey between two users', async () => {
    const app = ctx.makeApp();
    const alice = await newUser(app, 'Alice');
    const bob = await newUser(app, 'Bob');

    // Alice posts an I NEED request.
    const need = await create(app, alice.token, 'needs', 'Beautiful website screenshots');

    // Bob discovers it.
    const found = await json<Ok<{ items: MarketItem[] }>>(await get(app, bob.token, '/api/v1/needs?limit=50'));
    expect(found.data.items.map((i) => i.id)).toContain(need.id);

    // Bob offers one of his listings for it (recipient NOT sent by the client).
    const bobHas = await create(app, bob.token, 'listings', 'Logo design');
    const sent = await post(app, bob.token, '/api/v1/offers', {
      offeredListingId: bobHas.id,
      requestedNeedId: need.id,
      message: 'I can make these for you.',
    });
    expect(sent.status).toBe(201);
    const offer = (await json<Ok<{ offer: OfferView }>>(sent)).data.offer;
    expect(offer.status).toBe('pending');
    expect(offer.toUser.id).toBe(alice.user.id);
    expect(offer.requestedKind).toBe('need');
    expect(offer.requested.title).toBe('Beautiful website screenshots');
    // Chat is available the moment the offer is sent.
    expect(offer.conversationId).toBeTruthy();

    // Alice receives it: incoming list + notification.
    const incoming = await json<Ok<{ items: OfferView[] }>>(await get(app, alice.token, '/api/v1/offers/incoming'));
    expect(incoming.data.items.map((o) => o.id)).toContain(offer.id);
    const notes = await json<Ok<{ items: { type: string }[] }>>(await get(app, alice.token, '/api/v1/notifications'));
    expect(notes.data.items.some((n) => n.type === 'offer_received')).toBe(true);

    // Both sides chat in the SAME conversation; messages persist.
    const conv = `/api/v1/conversations/${offer.conversationId}`;
    expect((await post(app, bob.token, `${conv}/messages`, { body: 'Hey, I can create the screenshots.' })).status).toBe(201);
    expect((await post(app, alice.token, `${conv}/messages`, { body: 'Great, what style?' })).status).toBe(201);
    const thread = await json<Ok<{ items: { body: string }[] }>>(await get(app, alice.token, `${conv}/messages`));
    expect(thread.data.items.map((m) => m.body)).toEqual(
      expect.arrayContaining(['Hey, I can create the screenshots.', 'Great, what style?']),
    );

    // A third user can read neither the offer nor the conversation.
    const eve = await newUser(app, 'Eve');
    expect((await get(app, eve.token, `/api/v1/offers/${offer.id}`)).status).toBe(404);
    expect([403, 404]).toContain((await get(app, eve.token, `${conv}/messages`)).status);

    // Only Alice (the recipient) can accept; the thread is kept and the
    // fulfilled request leaves the market.
    expect((await post(app, bob.token, `/api/v1/offers/${offer.id}/respond`, { action: 'accept' })).status).toBe(403);
    const acc = await post(app, alice.token, `/api/v1/offers/${offer.id}/respond`, { action: 'accept' });
    expect(acc.status).toBe(200);
    const accepted = (await json<Ok<{ offer: OfferView }>>(acc)).data.offer;
    expect(accepted.status).toBe('accepted');
    expect(accepted.conversationId).toBe(offer.conversationId);
    const bobView = (await json<Ok<{ offer: OfferView }>>(await get(app, bob.token, `/api/v1/offers/${offer.id}`))).data.offer;
    expect(bobView.status).toBe('accepted');
    const needAfter = await get(app, bob.token, `/api/v1/needs?limit=50`);
    expect((await json<Ok<{ items: MarketItem[] }>>(needAfter)).data.items.map((i) => i.id)).not.toContain(need.id);
  });

  it('never trusts a client-supplied recipient or someone else’s image', async () => {
    const app = ctx.makeApp();
    const alice = await newUser(app, 'Alice');
    const bob = await newUser(app, 'Bob');
    const eve = await newUser(app, 'Eve');
    const need = await create(app, alice.token, 'needs', 'Screenshots');
    const bobHas = await create(app, bob.token, 'listings', 'Logo design');

    const spoof = await post(app, bob.token, '/api/v1/offers', {
      toUserId: eve.user.id,
      offeredListingId: bobHas.id,
      requestedNeedId: need.id,
    });
    expect(spoof.status).toBe(422);

    const foreignImage = await post(app, bob.token, '/api/v1/offers', {
      offeredListingId: bobHas.id,
      requestedNeedId: need.id,
      imageKey: `offers/${eve.user.id}/x.jpg`,
    });
    expect(foreignImage.status).toBe(403);

    // Cannot offer on your own request.
    const aliceHas = await create(app, alice.token, 'listings', 'Something');
    const self = await post(app, alice.token, '/api/v1/offers', {
      offeredListingId: aliceHas.id,
      requestedNeedId: need.id,
    });
    expect(self.status).toBe(422);
  });

  it('requires exactly one target', async () => {
    const app = ctx.makeApp();
    const bob = await newUser(app, 'Bob');
    const bobHas = await create(app, bob.token, 'listings', 'Logo design');
    const none = await post(app, bob.token, '/api/v1/offers', { offeredListingId: bobHas.id });
    expect(none.status).toBe(422);
  });
});
