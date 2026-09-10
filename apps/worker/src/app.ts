import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { type AppDeps } from './context';
import { ApiError, sendError } from './lib/http';
import { createApiV1 } from './routes/api/v1';
import { health } from './routes/health';
import { type AppEnv } from './types';

/** Origins always allowed to send credentialed requests in development. */
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

/**
 * The PANDAM API application. A pure Hono app (no `fetch` export) so tests call
 * `app.request(...)` with no network. `createApp({ db })` injects a database in
 * tests; production builds one from `env.DB`.
 *
 * Structure:
 *   GET  /             service banner
 *   GET  /health       liveness
 *   /api/v1/*          versioned API (see routes/api/v1)
 *
 * Every response body is a `@pandam/types` envelope. `onError` maps a thrown
 * `ApiError` to its status + envelope and anything else to a generic
 * `internal_error` — internals are never leaked to the client. CORS is an
 * explicit allowlist with credentials enabled (never `*`, which cannot be
 * combined with cookies).
 */
export function createApp(deps: AppDeps = {}) {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use('*', (c, next) => {
    const configured = (c.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allowed = new Set([...configured, ...DEV_ORIGINS]);
    return cors({
      origin: (origin) => (allowed.has(origin) ? origin : null),
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })(c, next);
  });

  app.get('/', (c) => c.json({ ok: true, data: { service: 'pandam-api', docs: '/api/v1' } }));
  app.route('/', health);
  app.route('/api/v1', createApiV1(deps));

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
