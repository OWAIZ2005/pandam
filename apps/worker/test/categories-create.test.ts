import { type AuthSession, type Category } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
beforeEach(async () => {
  ctx = await makeTestDb();
});
afterEach(() => ctx.close());

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: { code: string; details?: Record<string, string[]> } };

async function token(app: ReturnType<TestDb['makeApp']>) {
  const res = await app.request(
    '/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'c@example.com', password: 'correct horse 7', displayName: 'C' }),
    },
    testEnv,
  );
  return ((await res.json()) as Ok<AuthSession>).data.token;
}

function create(app: ReturnType<TestDb['makeApp']>, name: string, t?: string) {
  return app.request(
    '/api/v1/categories',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ name }),
    },
    testEnv,
  );
}

describe('POST /api/v1/categories', () => {
  it('creates a category that immediately appears in the list', async () => {
    const app = ctx.makeApp();
    const t = await token(app);
    const res = await create(app, '  Pottery   Classes ', t);
    expect(res.status).toBe(201);
    const { category } = ((await res.json()) as Ok<{ category: Category }>).data;
    expect(category.name).toBe('Pottery Classes');
    expect(category.slug).toBe('pottery-classes');

    const list = await app.request('/api/v1/categories', {}, testEnv);
    const { categories } = ((await list.json()) as Ok<{ categories: Category[] }>).data;
    expect(categories.map((c) => c.slug)).toContain('pottery-classes');
  });

  it('rejects a duplicate regardless of case/spacing and points at the existing one', async () => {
    const app = ctx.makeApp();
    const t = await token(app);
    const first = ((await (await create(app, 'Pottery Classes', t)).json()) as Ok<{ category: Category }>).data.category;
    const dup = await create(app, 'POTTERY   classes', t);
    expect(dup.status).toBe(409);
    expect(((await dup.json()) as Err).error.details?.existingId).toEqual([first.id]);
  });

  it('validates the name', async () => {
    const app = ctx.makeApp();
    const t = await token(app);
    expect((await create(app, ' ', t)).status).toBe(422);
    expect((await create(app, 'x'.repeat(33), t)).status).toBe(422);
    expect((await create(app, '!!', t)).status).toBe(422);
  });

  it('requires a session', async () => {
    expect((await create(ctx.makeApp(), 'Pottery')).status).toBe(401);
  });
});
