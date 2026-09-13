import { newId, schema } from '@pandam/database';
import { type AuthSession, type MarketItem } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
let catA = '';
let catB = '';

beforeEach(async () => {
  ctx = await makeTestDb();
  catA = newId('category');
  catB = newId('category');
  await ctx.db.insert(schema.categories).values([
    { id: catA, name: 'Web Design', slug: 'web-design' },
    { id: catB, name: 'Photography', slug: 'photography' },
  ]);
});
afterEach(() => ctx.close());

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: { code: string; message: string } };
const json = <T>(r: Response) => r.json() as Promise<T>;
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

async function newUser(app: ReturnType<TestDb['makeApp']>, name = 'User'): Promise<AuthSession> {
  const res = await app.request(
    '/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `u${Math.random().toString(36).slice(2)}@example.com`,
        password: 'a valid pw 12',
        displayName: name,
      }),
    },
    testEnv,
  );
  return (await json<Ok<AuthSession>>(res)).data;
}

function createListing(
  app: ReturnType<TestDb['makeApp']>,
  token: string,
  over: Record<string, unknown> = {},
) {
  return app.request(
    '/api/v1/listings',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify({
        categoryId: catA,
        type: 'service',
        title: 'I build websites',
        description: 'Modern responsive sites, hand-coded, fast.',
        status: 'published',
        ...over,
      }),
    },
    testEnv,
  );
}

describe('POST /api/v1/listings', () => {
  it('requires authentication', async () => {
    const res = await createListing(ctx.makeApp(), 'nope');
    expect(res.status).toBe(401);
  });

  it('creates a listing owned by the session user (never a client-sent owner)', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app, 'Ada');
    const res = await createListing(app, me.token, { ownerId: 'usr_' + '0'.repeat(32) });
    expect(res.status).toBe(201);
    const { data } = await json<Ok<{ item: MarketItem }>>(res);
    expect(data.item.ownerId).toBe(me.user.id);
    expect(data.item.owner.displayName).toBe('Ada');
    expect(data.item.category.slug).toBe('web-design');
    expect(data.item.kind).toBe('listing');
    // A barter listing (the default) carries pricing metadata but no actual
    // charge — the shape exists so `sale`/`both` listings can reuse it, but a
    // barter listing must never have a price attached.
    expect(data.item.pricing).toEqual({
      transactionType: 'barter',
      priceAmount: null,
      priceCurrency: 'INR',
    });
  });

  it('rejects invalid input (422)', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const res = await createListing(app, me.token, { title: 'ab', categoryId: 'bad' });
    expect(res.status).toBe(422);
    expect((await json<Err>(res)).error.code).toBe('validation_error');
  });

  it('creates a `sale` listing with a price', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const res = await createListing(app, me.token, {
      transactionType: 'sale',
      priceAmount: 250000,
    });
    expect(res.status).toBe(201);
    const { data } = await json<Ok<{ item: MarketItem }>>(res);
    expect(data.item.pricing).toEqual({
      transactionType: 'sale',
      priceAmount: 250000,
      priceCurrency: 'INR',
    });
  });

  it('rejects a `sale` listing with no price (422)', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const res = await createListing(app, me.token, { transactionType: 'sale' });
    expect(res.status).toBe(422);
  });

  it('rejects a `barter` listing that carries a price (422)', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const res = await createListing(app, me.token, {
      transactionType: 'barter',
      priceAmount: 500,
    });
    expect(res.status).toBe(422);
  });

  it('rejects a non-positive or fractional-looking price (422)', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const res = await createListing(app, me.token, { transactionType: 'sale', priceAmount: 0 });
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/v1/listings/:id (pricing transitions)', () => {
  it('switching to `sale` without a price is rejected (422)', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const created = await json<Ok<{ item: MarketItem }>>(await createListing(app, me.token));
    const res = await app.request(
      `/api/v1/listings/${created.data.item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(me.token) },
        body: JSON.stringify({ transactionType: 'sale' }),
      },
      testEnv,
    );
    expect(res.status).toBe(422);
  });

  it('switching to `sale` with a price in the same request succeeds', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const created = await json<Ok<{ item: MarketItem }>>(await createListing(app, me.token));
    const res = await app.request(
      `/api/v1/listings/${created.data.item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(me.token) },
        body: JSON.stringify({ transactionType: 'both', priceAmount: 999900 }),
      },
      testEnv,
    );
    expect(res.status).toBe(200);
    const { data } = await json<Ok<{ item: MarketItem }>>(res);
    expect(data.item.pricing).toEqual({
      transactionType: 'both',
      priceAmount: 999900,
      priceCurrency: 'INR',
    });
  });

  it('switching back to `barter` clears the price, even without saying so', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const created = await json<Ok<{ item: MarketItem }>>(
      await createListing(app, me.token, { transactionType: 'sale', priceAmount: 4200 }),
    );
    const res = await app.request(
      `/api/v1/listings/${created.data.item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(me.token) },
        body: JSON.stringify({ transactionType: 'barter' }),
      },
      testEnv,
    );
    expect(res.status).toBe(200);
    const { data } = await json<Ok<{ item: MarketItem }>>(res);
    expect(data.item.pricing?.priceAmount).toBeNull();
  });

  it('updating only the price on an existing `sale` listing keeps working', async () => {
    const app = ctx.makeApp();
    const me = await newUser(app);
    const created = await json<Ok<{ item: MarketItem }>>(
      await createListing(app, me.token, { transactionType: 'sale', priceAmount: 1000 }),
    );
    const res = await app.request(
      `/api/v1/listings/${created.data.item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(me.token) },
        body: JSON.stringify({ priceAmount: 1500 }),
      },
      testEnv,
    );
    expect(res.status).toBe(200);
    const { data } = await json<Ok<{ item: MarketItem }>>(res);
    expect(data.item.pricing).toEqual({
      transactionType: 'sale',
      priceAmount: 1500,
      priceCurrency: 'INR',
    });
  });
});

describe('GET /api/v1/listings (discovery)', () => {
  it('returns only published items, newest first, with a cursor', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    // `createdAt` has millisecond resolution and ties break on a random id, so
    // two inserts in the same millisecond would make "newest first" flaky —
    // space them out like real usage (nobody creates two listings in <1ms).
    await createListing(app, a.token, { title: 'Alpha site work' });
    await new Promise((r) => setTimeout(r, 2));
    await createListing(app, a.token, { title: 'Bravo site work' });
    await new Promise((r) => setTimeout(r, 2));
    await createListing(app, a.token, { title: 'Charlie draft', status: 'draft' });

    const res = await app.request('/api/v1/listings?limit=1', {}, testEnv);
    expect(res.status).toBe(200);
    const { data } = await json<Ok<{ items: MarketItem[]; nextCursor: string | null }>>(res);
    expect(data.items).toHaveLength(1);
    expect(data.items[0]?.title).toBe('Bravo site work'); // newest
    expect(data.nextCursor).toBeTruthy();

    const page2 = await app.request(
      `/api/v1/listings?limit=1&cursor=${encodeURIComponent(data.nextCursor!)}`,
      {},
      testEnv,
    );
    const body2 = await json<Ok<{ items: MarketItem[]; nextCursor: string | null }>>(page2);
    expect(body2.data.items[0]?.title).toBe('Alpha site work');
    expect(body2.data.nextCursor).toBeNull(); // draft is excluded
  });

  it('filters by category, type and text query', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    await createListing(app, a.token, { title: 'Portrait photography', categoryId: catB });
    await createListing(app, a.token, { title: 'Landing page build', categoryId: catA });

    const byCat = await json<Ok<{ items: MarketItem[] }>>(
      await app.request(`/api/v1/listings?category=${catB}`, {}, testEnv),
    );
    expect(byCat.data.items.map((i) => i.title)).toEqual(['Portrait photography']);

    const byText = await json<Ok<{ items: MarketItem[] }>>(
      await app.request('/api/v1/listings?q=landing', {}, testEnv),
    );
    expect(byText.data.items.map((i) => i.title)).toEqual(['Landing page build']);
  });
});

describe('GET /api/v1/listings/mine', () => {
  it('needs auth and returns every status for the caller only', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    const b = await newUser(app);
    await createListing(app, a.token, { title: 'A published' });
    await createListing(app, a.token, { title: 'A draft', status: 'draft' });
    await createListing(app, b.token, { title: 'B item' });

    expect((await app.request('/api/v1/listings/mine', {}, testEnv)).status).toBe(401);

    const mine = await json<Ok<{ items: MarketItem[] }>>(
      await app.request('/api/v1/listings/mine', { headers: bearer(a.token) }, testEnv),
    );
    expect(mine.data.items.map((i) => i.title).sort()).toEqual(['A draft', 'A published']);
  });
});

describe('ownership on PATCH / status', () => {
  it("a user cannot edit or restatus another user's listing", async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    const b = await newUser(app);
    const { data } = await json<Ok<{ item: MarketItem }>>(await createListing(app, a.token));

    const patch = await app.request(
      `/api/v1/listings/${data.item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(b.token) },
        body: JSON.stringify({ title: 'hijacked title' }),
      },
      testEnv,
    );
    expect(patch.status).toBe(403);

    const status = await app.request(
      `/api/v1/listings/${data.item.id}/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bearer(b.token) },
        body: JSON.stringify({ status: 'archived' }),
      },
      testEnv,
    );
    expect(status.status).toBe(403);

    // owner can
    const ok = await app.request(
      `/api/v1/listings/${data.item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({ title: 'Updated by owner ok' }),
      },
      testEnv,
    );
    expect(ok.status).toBe(200);
    expect((await json<Ok<{ item: MarketItem }>>(ok)).data.item.title).toBe('Updated by owner ok');
  });
});

describe('GET /api/v1/listings/:id visibility', () => {
  it('a draft is only visible to its owner', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    const b = await newUser(app);
    const { data } = await json<Ok<{ item: MarketItem }>>(
      await createListing(app, a.token, { status: 'draft' }),
    );

    expect((await app.request(`/api/v1/listings/${data.item.id}`, {}, testEnv)).status).toBe(404);
    expect(
      (await app.request(`/api/v1/listings/${data.item.id}`, { headers: bearer(b.token) }, testEnv))
        .status,
    ).toBe(404);
    expect(
      (await app.request(`/api/v1/listings/${data.item.id}`, { headers: bearer(a.token) }, testEnv))
        .status,
    ).toBe(200);
  });
});

describe('needs mirror listings', () => {
  it('create + discover a need', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    const res = await app.request(
      '/api/v1/needs',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({
          categoryId: catB,
          type: 'service',
          title: 'Need product photos',
          description: 'Looking for a photographer for ~20 product shots.',
          status: 'published',
        }),
      },
      testEnv,
    );
    expect(res.status).toBe(201);
    expect((await json<Ok<{ item: MarketItem }>>(res)).data.item.kind).toBe('need');

    const list = await json<Ok<{ items: MarketItem[] }>>(
      await app.request('/api/v1/needs', {}, testEnv),
    );
    expect(list.data.items.map((i) => i.title)).toEqual(['Need product photos']);
  });
});

describe('discovery by city', () => {
  /** Set the coarse city on a user's profile, the way the app's editor does. */
  const setCity = (app: ReturnType<TestDb['makeApp']>, token: string, city: string) =>
    app.request(
      '/api/v1/profiles/me',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(token) },
        body: JSON.stringify({ locationCity: city }),
      },
      testEnv,
    );

  it('filters listings to one city and reports the owner city on each card', async () => {
    const app = ctx.makeApp();
    const local = await newUser(app, 'Local');
    const distant = await newUser(app, 'Distant');
    await setCity(app, local.token, 'Kochi');
    await setCity(app, distant.token, 'Mumbai');

    await createListing(app, local.token, { title: 'Bike in Kochi' });
    await createListing(app, distant.token, { title: 'Bike in Mumbai' });

    const res = await app.request('/api/v1/listings?city=kochi', {}, testEnv);
    const items = (await json<Ok<{ items: MarketItem[] }>>(res)).data.items;
    // Matched case-insensitively, since the city is free text the user typed.
    expect(items.map((i) => i.title)).toEqual(['Bike in Kochi']);
    expect(items[0]!.owner.locationCity).toBe('Kochi');
  });

  it('leaves out owners who have set no city at all', async () => {
    const app = ctx.makeApp();
    const placeless = await newUser(app, 'Placeless');
    await createListing(app, placeless.token, { title: 'Bike from nowhere' });

    const filtered = await app.request('/api/v1/listings?city=Kochi', {}, testEnv);
    expect((await json<Ok<{ items: MarketItem[] }>>(filtered)).data.items).toEqual([]);

    // Unfiltered discovery still shows it — a missing city hides nothing.
    const all = await app.request('/api/v1/listings', {}, testEnv);
    expect((await json<Ok<{ items: MarketItem[] }>>(all)).data.items).toHaveLength(1);
  });

  it('offers only cities that actually have published listings', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app, 'A');
    const b = await newUser(app, 'B');
    const draftOnly = await newUser(app, 'C');
    await setCity(app, a.token, 'Kochi');
    await setCity(app, b.token, 'Kochi');
    await setCity(app, draftOnly.token, 'Ghost Town');

    await createListing(app, a.token, { title: 'One' });
    await createListing(app, b.token, { title: 'Two' });
    await createListing(app, draftOnly.token, { title: 'Unpublished', status: 'draft' });

    const res = await app.request('/api/v1/listings/cities', {}, testEnv);
    const items = (await json<Ok<{ items: { city: string; count: number }[] }>>(res)).data.items;
    expect(items).toEqual([{ city: 'Kochi', count: 2 }]);
  });

  it('rejects an over-long city value rather than running the query', async () => {
    const app = ctx.makeApp();
    const res = await app.request(`/api/v1/listings?city=${'x'.repeat(200)}`, {}, testEnv);
    expect(res.status).toBe(422);
  });
});
