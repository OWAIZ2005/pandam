import { type AuthSession, type AuthenticatedUser } from '@pandam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

let ctx: TestDb;
beforeEach(async () => {
  ctx = await makeTestDb();
});
afterEach(() => ctx.close());

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: { code: string } };

async function signUp(app: ReturnType<TestDb['makeApp']>) {
  const res = await app.request(
    '/api/v1/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'v@example.com',
        password: 'correct horse 7',
        displayName: 'V',
      }),
    },
    testEnv,
  );
  return ((await res.json()) as Ok<AuthSession>).data;
}

function step(
  app: ReturnType<TestDb['makeApp']>,
  token: string,
  path: 'government-id' | 'face',
  env: Record<string, string> = testEnv,
) {
  return app.request(
    `/api/v1/verification/${path}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode: 'demo' }),
    },
    env,
  );
}

describe('identity verification', () => {
  it('a new account starts not_started; me exposes it', async () => {
    const app = ctx.makeApp();
    const s = await signUp(app);
    expect(s.user.identityVerification).toEqual({
      status: 'not_started',
      governmentId: 'not_started',
      face: 'not_started',
    });
  });

  it('government-id -> in_progress, face -> verified; persists across a new login', async () => {
    const app = ctx.makeApp();
    const s = await signUp(app);

    const g = (await (await step(app, s.token, 'government-id')).json()) as Ok<AuthenticatedUser>;
    expect(g.data.user.identityVerification.status).toBe('in_progress');

    const f = (await (await step(app, s.token, 'face')).json()) as Ok<AuthenticatedUser>;
    expect(f.data.user.identityVerification).toEqual({
      status: 'verified',
      governmentId: 'verified',
      face: 'verified',
    });

    // Log in again: the fresh session sees the stored outcome.
    const login = await app.request(
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'v@example.com', password: 'correct horse 7' }),
      },
      testEnv,
    );
    const l = ((await login.json()) as Ok<AuthSession>).data;
    expect(l.user.identityVerification.status).toBe('verified');
  });

  it('face before government-id is refused (409) and leaves the account unverified', async () => {
    const app = ctx.makeApp();
    const s = await signUp(app);
    const res = await step(app, s.token, 'face');
    expect(res.status).toBe(409);
    const me = await app.request(
      '/api/v1/auth/me',
      { headers: { Authorization: `Bearer ${s.token}` } },
      testEnv,
    );
    expect(((await me.json()) as Ok<AuthenticatedUser>).data.user.identityVerification.status).toBe(
      'not_started',
    );
  });

  it('demo mode is refused in production', async () => {
    const app = ctx.makeApp();
    const s = await signUp(app);
    const res = await step(app, s.token, 'government-id', { PANDAM_ENV: 'production' });
    expect(res.status).toBe(501);
    expect(((await res.json()) as Err).error.code).toBe('not_implemented');
  });

  it('requires a session', async () => {
    const res = await ctx.makeApp().request(
      '/api/v1/verification/government-id',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"mode":"demo"}',
      },
      testEnv,
    );
    expect(res.status).toBe(401);
  });
});
