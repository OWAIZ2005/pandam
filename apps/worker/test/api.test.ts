import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

import { makeTestDb, testEnv, type TestDb } from './helpers/db';

const env = testEnv;

async function json(res: Response) {
  return (await res.json()) as Record<string, unknown>;
}

describe('service routes', () => {
  it('GET / returns a success envelope', async () => {
    const res = await createApp().request('/', {}, env);
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ ok: true, data: { service: 'pandam-api' } });
  });

  it('GET /health still works', async () => {
    const res = await createApp().request('/health', {}, env);
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ status: 'ok', service: 'pandam-api' });
  });

  it('unknown route returns a structured 404', async () => {
    const res = await createApp().request('/nope', {}, env);
    expect(res.status).toBe(404);
    expect(await json(res)).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('CORS', () => {
  it('echoes an allowed origin with credentials enabled', async () => {
    const res = await createApp().request(
      '/api/v1',
      { headers: { Origin: 'http://localhost:3000' } },
      env,
    );
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it('does not allow an unlisted origin', async () => {
    const res = await createApp().request(
      '/api/v1',
      { headers: { Origin: 'https://evil.example' } },
      env,
    );
    expect(res.headers.get('access-control-allow-origin')).not.toBe('https://evil.example');
  });
});

describe('/api/v1 surface', () => {
  it('describes implemented and planned groups', async () => {
    const res = await createApp().request('/api/v1', {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { version: string; implemented: { name: string }[]; planned: { name: string }[] };
    };
    expect(body.data.version).toBe('v1');
    expect(body.data.implemented.map((g) => g.name)).toEqual(
      expect.arrayContaining(['auth', 'profiles', 'categories', 'matches']),
    );
    expect(body.data.planned.map((g) => g.name)).toContain('listings');
    expect(body.data.planned.map((g) => g.name)).not.toContain('profiles');
  });

  it('planned groups return 501 not_implemented', async () => {
    const res = await createApp().request('/api/v1/listings', {}, env);
    expect(res.status).toBe(501);
    expect(await json(res)).toMatchObject({ ok: false, error: { code: 'not_implemented' } });
  });

  it('returns 503 db_unavailable (no leaked internals) when D1 is not bound', async () => {
    const res = await createApp().request('/api/v1/categories', {}, env);
    expect(res.status).toBe(503);
    const body = await json(res);
    expect(body).toMatchObject({ ok: false, error: { code: 'db_unavailable' } });
    expect(JSON.stringify(body)).not.toMatch(/stack|\bError:/i);
  });
});

describe('/api/v1 with a database', () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await makeTestDb();
  });
  afterEach(() => ctx.close());

  it('GET /api/v1/categories works (empty until seeded)', async () => {
    const res = await ctx.makeApp().request('/api/v1/categories', {}, env);
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ ok: true, data: { categories: [] } });
  });

  it('GET /api/v1/matches rejects an unauthenticated request with 401', async () => {
    const res = await ctx.makeApp().request('/api/v1/matches', {}, env);
    expect(res.status).toBe(401);
    expect(await json(res)).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
  });
});
