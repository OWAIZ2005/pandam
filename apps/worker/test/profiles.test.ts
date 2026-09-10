import { type AuthSession } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
beforeEach(async () => {
  ctx = await makeTestDb();
});
afterEach(() => ctx.close());

type Ok<T> = { ok: true; data: T };
type Err = {
  ok: false;
  error: { code: string; message: string; details?: Record<string, string[]> };
};

async function newUser(
  app: ReturnType<TestDb['makeApp']>,
  over: Record<string, unknown> = {},
): Promise<AuthSession> {
  const res = await app.request(
    '/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `u${Math.random().toString(36).slice(2)}@example.com`,
        password: 'valid password 1',
        displayName: 'User',
        ...over,
      }),
    },
    testEnv,
  );
  return ((await res.json()) as Ok<AuthSession>).data;
}

const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('/api/v1/profiles/me', () => {
  it('requires authentication', async () => {
    const app = ctx.makeApp();
    for (const method of ['GET', 'PUT', 'PATCH']) {
      const res = await app.request(
        '/api/v1/profiles/me',
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'GET' ? undefined : '{}',
        },
        testEnv,
      );
      expect(res.status).toBe(401);
    }
  });

  it('returns the caller’s own profile', async () => {
    const app = ctx.makeApp();
    const session = await newUser(app, { displayName: 'Ada', username: 'ada' });
    const res = await app.request(
      '/api/v1/profiles/me',
      { headers: bearer(session.token) },
      testEnv,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as Ok<{ profile: { displayName: string } }>;
    expect(data.profile.displayName).toBe('Ada');
  });

  it('PATCH updates only supplied fields and only the caller’s row', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app, { displayName: 'A', username: 'usera' });
    const b = await newUser(app, { displayName: 'B', username: 'userb' });

    const res = await app.request(
      '/api/v1/profiles/me',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({ bio: 'trading plants' }),
      },
      testEnv,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as Ok<{ profile: { bio: string; displayName: string } }>;
    expect(data.profile.bio).toBe('trading plants');
    expect(data.profile.displayName).toBe('A');

    // B is untouched.
    const bRes = await app.request('/api/v1/profiles/me', { headers: bearer(b.token) }, testEnv);
    const bBody = (await bRes.json()) as Ok<{ profile: { bio: string | null } }>;
    expect(bBody.data.profile.bio).toBeNull();
  });

  it('PUT replaces the profile; omitted optionals are cleared', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app, { displayName: 'A', username: 'putuser' });
    await app.request(
      '/api/v1/profiles/me',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({ bio: 'to be cleared' }),
      },
      testEnv,
    );
    const res = await app.request(
      '/api/v1/profiles/me',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({ displayName: 'A2' }),
      },
      testEnv,
    );
    const { data } = (await res.json()) as Ok<{
      profile: { displayName: string; bio: string | null };
    }>;
    expect(data.profile.displayName).toBe('A2');
    expect(data.profile.bio).toBeNull();
  });

  it('rejects a username already taken by another user (409)', async () => {
    const app = ctx.makeApp();
    await newUser(app, { username: 'taken' });
    const b = await newUser(app, { username: 'freeb' });
    const res = await app.request(
      '/api/v1/profiles/me',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(b.token) },
        body: JSON.stringify({ username: 'taken' }),
      },
      testEnv,
    );
    expect(res.status).toBe(409);
    expect(((await res.json()) as Err).error.code).toBe('conflict');
  });

  it('rejects invalid input (422) and an empty PATCH', async () => {
    const app = ctx.makeApp();
    const a = await newUser(app);
    const bad = await app.request(
      '/api/v1/profiles/me',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({ username: 'Has Spaces!' }),
      },
      testEnv,
    );
    expect(bad.status).toBe(422);

    const empty = await app.request(
      '/api/v1/profiles/me',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer(a.token) },
        body: JSON.stringify({}),
      },
      testEnv,
    );
    expect(empty.status).toBe(422);
  });
});
