import { Hono } from 'hono';

import { type AppBindings } from '../env';

export const health = new Hono<AppBindings>();

health.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'pandam-api',
    env: c.env.PANDAM_ENV ?? 'development',
    time: new Date().toISOString(),
  }),
);
