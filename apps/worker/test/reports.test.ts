/**
 * Abuse reports and disputes.
 *
 * `reports.subject_id` is polymorphic and therefore has no foreign key, so
 * the tests that matter here are the ones proving the route validates the
 * subject itself — and that a dispute is invisible to anyone who was not in
 * the transaction.
 */
import { newId, schema } from '@pandam/database';
import { type AuthSession, type MarketItem } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
let catId = '';

beforeEach(async () => {
  ctx = await makeTestDb();
  catId = newId('category');
  await ctx.db.insert(schema.categories).values([{ id: catId, name: 'Books', slug: 'books' }]);
});
afterEach(() => ctx.close());

type Ok<T> = { ok: true; data: T };
const json = <T>(r: Response) => r.json() as Promise<T>;
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

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

const post = (path: string, token: string, body: unknown) =>
  ctx.makeApp().request(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify(body),
    },
    testEnv,
  );

async function createListing(token: string, title: string): Promise<MarketItem> {
  const res = await post('/api/v1/listings', token, {
    categoryId: catId,
    type: 'product',
    title,
    description: 'Something worth trading away.',
    status: 'published',
  });
  return (await json<Ok<{ item: MarketItem }>>(res)).data.item;
}

describe('POST /api/v1/reports', () => {
  it('records a report against a real listing', async () => {
    const owner = await register('seller');
    const reporter = await register('reporter');
    const listing = await createListing(owner.token, 'Suspicious bargain');

    const res = await post('/api/v1/reports', reporter.token, {
      subjectType: 'listing',
      subjectId: listing.id,
      reason: 'scam',
      details: 'Asking me to pay outside the app.',
    });
    expect(res.status).toBe(201);
    const { report } = (await json<Ok<{ report: { status: string; reason: string } }>>(res)).data;
    // A report is a record for a human to review — never an auto-takedown.
    expect(report.status).toBe('open');
    expect(report.reason).toBe('scam');

    const still = await ctx.makeApp().request(`/api/v1/listings/${listing.id}`, {}, testEnv);
    expect(still.status).toBe(200);
  });

  it('rejects a subject that does not exist', async () => {
    const reporter = await register('ghosthunter');
    const res = await post('/api/v1/reports', reporter.token, {
      subjectType: 'listing',
      subjectId: newId('listing'),
      reason: 'spam',
    });
    expect(res.status).toBe(404);
  });

  it('rejects an unknown reason', async () => {
    const owner = await register('owner');
    const reporter = await register('creative');
    const listing = await createListing(owner.token, 'A book');

    const res = await post('/api/v1/reports', reporter.token, {
      subjectType: 'listing',
      subjectId: listing.id,
      reason: 'i just do not like it',
    });
    expect(res.status).toBe(422);
  });

  it('will not let someone report themselves', async () => {
    const me = await register('selfcritic');
    const res = await post('/api/v1/reports', me.token, {
      subjectType: 'user',
      subjectId: me.user.id,
      reason: 'other',
    });
    expect(res.status).toBe(422);
  });

  it('lists back only the reports the caller filed', async () => {
    const owner = await register('owner');
    const mine = await register('mine');
    const theirs = await register('theirs');
    const listing = await createListing(owner.token, 'Contested item');

    await post('/api/v1/reports', mine.token, {
      subjectType: 'listing',
      subjectId: listing.id,
      reason: 'spam',
    });
    await post('/api/v1/reports', theirs.token, {
      subjectType: 'listing',
      subjectId: listing.id,
      reason: 'scam',
    });

    const res = await ctx
      .makeApp()
      .request('/api/v1/reports/mine', { headers: bearer(mine.token) }, testEnv);
    const items = (await json<Ok<{ items: { reason: string }[] }>>(res)).data.items;
    expect(items).toHaveLength(1);
    expect(items[0]!.reason).toBe('spam');
  });

  it('requires a session', async () => {
    const res = await ctx.makeApp().request(
      '/api/v1/reports',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectType: 'user', subjectId: newId('user'), reason: 'spam' }),
      },
      testEnv,
    );
    expect(res.status).toBe(401);
  });
});

describe('disputes', () => {
  /** Drive a real offer through to an accepted transaction between two users. */
  async function tradeBetween(a: AuthSession, b: AuthSession): Promise<string> {
    const mine = await createListing(a.token, 'My side of the trade');
    const theirs = await createListing(b.token, 'Their side of the trade');

    const offerRes = await post('/api/v1/offers', a.token, {
      toUserId: b.user.id,
      offeredListingId: mine.id,
      requestedListingId: theirs.id,
      message: 'Straight swap?',
    });
    const offer = (await json<Ok<{ offer: { id: string } }>>(offerRes)).data.offer;

    const acceptRes = await post(`/api/v1/offers/${offer.id}/respond`, b.token, {
      action: 'accept',
    });
    expect(acceptRes.status).toBe(200);

    // The offer view does not carry the transaction id, so read it the way the
    // app does: from the caller's own transaction list.
    const list = await ctx
      .makeApp()
      .request('/api/v1/transactions', { headers: bearer(b.token) }, testEnv);
    const transactions = (await json<Ok<{ items: { id: string }[] }>>(list)).data.items;
    return transactions[0]!.id;
  }

  it('lets a participant raise a dispute and see it', async () => {
    const a = await register('alice');
    const b = await register('bob');
    const transactionId = await tradeBetween(a, b);

    const res = await post('/api/v1/reports/disputes', a.token, {
      transactionId,
      reason: 'Item never arrived',
      details: 'We agreed to meet on Tuesday and they did not show.',
    });
    expect(res.status).toBe(201);
    expect((await json<Ok<{ dispute: { status: string } }>>(res)).data.dispute.status).toBe('open');

    const list = await ctx
      .makeApp()
      .request(`/api/v1/reports/disputes/${transactionId}`, { headers: bearer(b.token) }, testEnv);
    const items = (await json<Ok<{ items: { mine: boolean }[] }>>(list)).data.items;
    // Both sides can see it; `mine` tells them who raised it.
    expect(items).toHaveLength(1);
    expect(items[0]!.mine).toBe(false);
  });

  it('hides the transaction entirely from an outsider', async () => {
    const a = await register('alice');
    const b = await register('bob');
    const nosy = await register('nosy');
    const transactionId = await tradeBetween(a, b);

    const raise = await post('/api/v1/reports/disputes', nosy.token, {
      transactionId,
      reason: 'I would like to interfere',
    });
    // 404, not 403: whether that transaction exists is none of their business.
    expect(raise.status).toBe(404);

    const read = await ctx
      .makeApp()
      .request(
        `/api/v1/reports/disputes/${transactionId}`,
        { headers: bearer(nosy.token) },
        testEnv,
      );
    expect(read.status).toBe(404);
  });
});
