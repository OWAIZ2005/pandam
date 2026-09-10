import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { type AppBindings } from './env';
import { health } from './routes/health';

/**
 * The PANDAM API application. Kept as a pure Hono app (no `fetch` export) so it
 * can be imported directly in tests via `app.request(...)`.
 *
 * Business routes (auth, listings, offers, chat, ...) are NOT mounted yet — this
 * phase is infrastructure only.
 */
export function createApp() {
  const app = new Hono<AppBindings>();

  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));

  app.route('/', health);

  app.get('/', (c) => c.json({ service: 'pandam-api', docs: '/health' }));

  app.notFound((c) =>
    c.json({ ok: false, error: { code: 'not_found', message: 'Not found' } }, 404),
  );

  app.onError((err, c) => {
    console.error('[pandam-api] unhandled error', err);
    return c.json(
      { ok: false, error: { code: 'internal_error', message: 'Internal server error' } },
      500,
    );
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
