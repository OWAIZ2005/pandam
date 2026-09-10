import { Hono } from 'hono';

import { type AppEnv } from '../types';

export const health = new Hono<AppEnv>();

health.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'pandam-api',
    env: c.env.PANDAM_ENV ?? 'development',
    time: new Date().toISOString(),
  }),
);
