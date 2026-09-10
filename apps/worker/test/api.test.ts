import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

const env = { PANDAM_ENV: 'development' } as const;

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
    const body = await json(res);
    expect(body).toMatchObject({ status: 'ok', service: 'pandam-api' });
  });

  it('unknown route returns a structured 404', async () => {
    const res = await createApp().request('/nope', {}, env);
    expect(res.status).toBe(404);
    expect(await json(res)).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('/api/v1', () => {
  it('describes the surface', async () => {
    const res = await createApp().request('/api/v1', {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { version: string; planned: { name: string }[] };
    };
    expect(body.ok).toBe(true);
    expect(body.data.version).toBe('v1');
    expect(body.data.planned.map((g) => g.name)).toContain('listings');
  });

  it('planned groups return 501 not_implemented', async () => {
    const res = await createApp().request('/api/v1/listings', {}, env);
    expect(res.status).toBe(501);
    expect(await json(res)).toMatchObject({ ok: false, error: { code: 'not_implemented' } });
  });

  it('categories returns 503 with a clean envelope when D1 is not bound', async () => {
    const res = await createApp().request('/api/v1/categories', {}, env);
    expect(res.status).toBe(503);
    const body = await json(res);
    expect(body).toMatchObject({ ok: false, error: { code: 'db_unavailable' } });
    // never leak internals
    expect(JSON.stringify(body)).not.toMatch(/stack|Error:/i);
  });

  it('matches requires auth (401) before it needs the DB', async () => {
    const res = await createApp().request('/api/v1/matches', {}, env);
    expect(res.status).toBe(401);
    expect(await json(res)).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
  });
});
