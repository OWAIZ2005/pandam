import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { type AppBindings } from './env';
import { ApiError, sendError } from './lib/http';
import { apiV1 } from './routes/api/v1';
import { health } from './routes/health';

/**
 * The PANDAM API application. A pure Hono app (no `fetch` export) so tests call
 * `app.request(...)` with no network.
 *
 * Structure:
 *   GET  /             service banner
 *   GET  /health       liveness
 *   /api/v1/*          versioned API (see routes/api/v1)
 *
 * Every response body is a `@pandam/types` envelope. `onError` maps a thrown
 * `ApiError` to its status + envelope and anything else to a generic
 * `internal_error` — internals are never leaked to the client.
 */
export function createApp() {
  const app = new Hono<AppBindings>();

  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({ origin: '*', allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] }),
  );

  app.get('/', (c) => c.json({ ok: true, data: { service: 'pandam-api', docs: '/api/v1' } }));
  app.route('/', health);
  app.route('/api/v1', apiV1);

  app.notFound((c) => sendError(c, 'not_found', 'Not found'));

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return sendError(c, err.code, err.message, err.details);
    }
    console.error('[pandam-api] unhandled error', err);
    return sendError(c, 'internal_error', 'Internal server error');
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
