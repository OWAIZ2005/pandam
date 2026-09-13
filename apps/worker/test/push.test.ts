/**
 * Push registration and the notify service.
 *
 * No real network call happens here: `fetch` is stubbed so the tests can
 * assert what PANDAM sends to Expo, and — more importantly — that a failing
 * or unreachable push service never breaks the request that triggered it.
 */
import { newId, schema } from '@pandam/database';
import { type AuthSession, type MarketItem, type NotificationView } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
let catId = '';
const realFetch = globalThis.fetch;

beforeEach(async () => {
  ctx = await makeTestDb();
  catId = newId('category');
  await ctx.db.insert(schema.categories).values([{ id: catId, name: 'Music', slug: 'music' }]);
});
afterEach(() => {
  globalThis.fetch = realFetch;
  ctx.close();
});

type Ok<T> = { ok: true; data: T };
const json = <T>(r: Response) => r.json() as Promise<T>;
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
const TOKEN_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const TOKEN_B = 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]';

async function register(name: string): Promise<AuthSession> {
  const res = await ctx.makeApp().request(
    '/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `${name}${Math.random().toString(36).slice(2)}@example.com`,
        password: 'a valid pw 12',
        displayName: name,
      }),
    },
    testEnv,
  );
  return (await json<Ok<AuthSession>>(res)).data;
}

const post = (path: string, token: string, body?: unknown) =>
  ctx.makeApp().request(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    testEnv,
  );

/**
 * Replace `fetch` with a recorder. Only Expo's push endpoint is intercepted;
 * anything else would be a bug in a test, so it throws loudly.
 */
function stubExpo(reply: (body: unknown[]) => unknown) {
  const calls: unknown[][] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const href = typeof url === 'string' ? url : url.toString();
    if (!href.includes('exp.host')) throw new Error(`unexpected fetch to ${href}`);
    const sent = JSON.parse(String(init?.body)) as unknown[];
    calls.push(sent);
    return new Response(JSON.stringify(reply(sent)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return calls;
}

/** Tickets Expo returns when every message was accepted. */
const allOk = (sent: unknown[]) => ({ data: sent.map(() => ({ status: 'ok', id: 'x' })) });

async function createListing(token: string, title: string): Promise<MarketItem> {
  const res = await post('/api/v1/listings', token, {
    categoryId: catId,
    type: 'product',
    title,
    description: 'A thing that exists to trigger notifications.',
    status: 'published',
  });
  return (await json<Ok<{ item: MarketItem }>>(res)).data.item;
}

/** An offer from `a` to `b`, which is what produces an `offer_received`. */
async function offerTo(a: AuthSession, b: AuthSession) {
  const mine = await createListing(a.token, 'Mine');
  const theirs = await createListing(b.token, 'Theirs');
  return post('/api/v1/offers', a.token, {
    toUserId: b.user.id,
    offeredListingId: mine.id,
    requestedListingId: theirs.id,
  });
}

describe('POST /api/v1/notifications/tokens', () => {
  it('registers a device and is idempotent', async () => {
    const me = await register('devicehaver');
    expect(
      (
        await post('/api/v1/notifications/tokens', me.token, {
          token: TOKEN_A,
          platform: 'ios',
        })
      ).status,
    ).toBe(201);
    // Every cold start re-registers; that must not double up the device.
    expect(
      (
        await post('/api/v1/notifications/tokens', me.token, {
          token: TOKEN_A,
          platform: 'ios',
        })
      ).status,
    ).toBe(201);

    const calls = stubExpo(allOk);
    const them = await register('offerer');
    await offerTo(them, me);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(1);
  });

  it('rejects anything that is not an Expo push token', async () => {
    const me = await register('faker');
    const res = await post('/api/v1/notifications/tokens', me.token, {
      token: 'https://evil.example.com/collect',
      platform: 'ios',
    });
    expect(res.status).toBe(422);
  });

  it('moves a device to whoever signed in on it last', async () => {
    const first = await register('firstowner');
    const second = await register('secondowner');
    await post('/api/v1/notifications/tokens', first.token, {
      token: TOKEN_A,
      platform: 'android',
    });
    await post('/api/v1/notifications/tokens', second.token, {
      token: TOKEN_A,
      platform: 'android',
    });

    // A notification for the FIRST user must no longer reach that phone.
    const calls = stubExpo(allOk);
    const them = await register('offerer');
    await offerTo(them, first);
    expect(calls).toHaveLength(0);
  });

  it('stops pushing to a device that signs out', async () => {
    const me = await register('signerouter');
    await post('/api/v1/notifications/tokens', me.token, { token: TOKEN_A, platform: 'ios' });
    const res = await ctx.makeApp().request(
      '/api/v1/notifications/tokens',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...bearer(me.token) },
        body: JSON.stringify({ token: TOKEN_A, platform: 'ios' }),
      },
      testEnv,
    );
    expect(res.status).toBe(200);

    const calls = stubExpo(allOk);
    const them = await register('offerer');
    await offerTo(them, me);
    expect(calls).toHaveLength(0);
  });
});

describe('push delivery', () => {
  it('sends one message per device, with the unread count as the badge', async () => {
    const me = await register('twodevices');
    await post('/api/v1/notifications/tokens', me.token, { token: TOKEN_A, platform: 'ios' });
    await post('/api/v1/notifications/tokens', me.token, { token: TOKEN_B, platform: 'android' });

    const calls = stubExpo(allOk);
    const them = await register('offerer');
    await offerTo(them, me);

    const messages = calls[0] as { to: string; title: string; body: string; badge: number }[];
    expect(messages.map((m) => m.to).sort()).toEqual([TOKEN_A, TOKEN_B].sort());
    expect(messages[0]!.title).toBe('New trade offer');
    expect(messages[0]!.badge).toBe(1);
    // The lock screen says something happened, never what or with whom.
    expect(messages[0]!.body).not.toContain('Mine');
    expect(messages[0]!.body).not.toContain('offerer');
  });

  it('disables a token Expo reports as unregistered', async () => {
    const me = await register('uninstaller');
    await post('/api/v1/notifications/tokens', me.token, { token: TOKEN_A, platform: 'ios' });

    stubExpo(() => ({
      data: [{ status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }],
    }));
    const them = await register('offerer');
    await offerTo(them, me);

    // Second notification: the dead token is gone, so nothing is sent.
    const calls = stubExpo(allOk);
    await offerTo(them, me);
    expect(calls).toHaveLength(0);
  });

  it('still records the notification when Expo is unreachable', async () => {
    const me = await register('offline');
    await post('/api/v1/notifications/tokens', me.token, { token: TOKEN_A, platform: 'ios' });

    globalThis.fetch = (async () => {
      throw new Error('network down');
    }) as typeof fetch;

    const them = await register('offerer');
    const res = await offerTo(them, me);
    // The request that triggered the push must not fail because of the push.
    expect(res.status).toBe(201);

    const feed = await ctx
      .makeApp()
      .request('/api/v1/notifications', { headers: bearer(me.token) }, testEnv);
    const items = (await json<Ok<{ items: NotificationView[] }>>(feed)).data.items;
    expect(items.map((n) => n.type)).toContain('offer_received');
  });
});

describe('POST /api/v1/notifications/read-all', () => {
  it('clears every unread notification', async () => {
    const me = await register('reader');
    const them = await register('offerer');
    await offerTo(them, me);
    await offerTo(them, me);

    const res = await post('/api/v1/notifications/read-all', me.token);
    expect((await json<Ok<{ read: number }>>(res)).data.read).toBe(2);

    const unread = await ctx
      .makeApp()
      .request('/api/v1/notifications?unread=true', { headers: bearer(me.token) }, testEnv);
    expect((await json<Ok<{ items: unknown[] }>>(unread)).data.items).toEqual([]);
  });
});

describe('no registered devices', () => {
  it('never calls Expo at all', async () => {
    const me = await register('nopush');
    const spy = vi.fn();
    globalThis.fetch = (async (...args: unknown[]) => {
      spy(args);
      throw new Error('should not be called');
    }) as unknown as typeof fetch;

    const them = await register('offerer');
    const res = await offerTo(them, me);
    expect(res.status).toBe(201);
    expect(spy).not.toHaveBeenCalled();
  });
});
