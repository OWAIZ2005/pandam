import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

const env = { PANDAM_ENV: 'development' } as const;

describe('GET /health', () => {
  it('returns ok status and service name', async () => {
    const app = createApp();
    const res = await app.request('/health', {}, env);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('pandam-api');
  });
});

describe('unknown route', () => {
  it('returns a 404 error envelope', async () => {
    const app = createApp();
    const res = await app.request('/does-not-exist', {}, env);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });
});
