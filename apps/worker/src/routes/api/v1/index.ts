/**
 * PANDAM API v1.
 *
 * `contextMiddleware` builds the DB-backed `RequestContext` for the groups that
 * need it. `GET /api/v1` describes the surface. Every non-implemented resource
 * group is mounted and returns `501 not_implemented` (see `./planned.ts`).
 */
import { Hono } from 'hono';

import { type AppDeps } from '../../../context';
import { sendOk } from '../../../lib/http';
import { contextMiddleware } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

import { authRoute } from './auth';
import { categoriesRoute } from './categories';
import { createMarketRoute } from './market';
import { matchesRoute } from './matches';
import { PLANNED_GROUPS, plannedGroupRouter } from './planned';
import { profilesRoute } from './profiles';

const IMPLEMENTED = [
  {
    name: 'auth',
    summary: 'Session authentication (register / login / logout / me)',
    endpoints: ['POST /register', 'POST /login', 'POST /logout', 'GET /me'],
  },
  {
    name: 'profiles',
    summary: "The caller's own profile",
    endpoints: ['GET /me', 'PUT /me', 'PATCH /me'],
  },
  {
    name: 'categories',
    summary: 'Curated categories (normalised matching key)',
    endpoints: ['GET /'],
  },
  {
    name: 'listings',
    summary: '"I HAVE" — products, services, skills offered',
    endpoints: ['GET /', 'GET /mine', 'POST /', 'GET /:id', 'PATCH /:id', 'POST /:id/status'],
  },
  {
    name: 'needs',
    summary: '"I NEED" — what a user wants in exchange',
    endpoints: ['GET /', 'GET /mine', 'POST /', 'GET /:id', 'PATCH /:id', 'POST /:id/status'],
  },
  {
    name: 'matches',
    summary: 'Deterministic reciprocal barter candidates (you ↔ them)',
    endpoints: ['GET /'],
  },
];

/** Route groups that talk to the database — they get the request context. */
const DB_GROUPS = ['auth', 'profiles', 'categories', 'listings', 'needs', 'matches'] as const;

export function createApiV1(deps: AppDeps = {}) {
  const apiV1 = new Hono<AppEnv>();

  for (const group of DB_GROUPS) {
    apiV1.use(`/${group}/*`, contextMiddleware(deps));
  }

  apiV1.get('/', (c) =>
    sendOk(c, {
      version: 'v1',
      implemented: IMPLEMENTED,
      planned: PLANNED_GROUPS.map(({ name, summary, endpoints }) => ({ name, summary, endpoints })),
      notes: [
        'Identity comes only from a verified session (HttpOnly cookie for web, Bearer token for native).',
        'No money: no price, buy, sell, checkout, cart, wallet or payment anywhere in V1.',
        'AI matching, credits and multi-party barter are explicitly out of scope for V1.',
      ],
    }),
  );

  apiV1.route('/auth', authRoute);
  apiV1.route('/profiles', profilesRoute);
  apiV1.route('/categories', categoriesRoute);
  apiV1.route('/listings', createMarketRoute('listing'));
  apiV1.route('/needs', createMarketRoute('need'));
  apiV1.route('/matches', matchesRoute);

  for (const group of PLANNED_GROUPS) {
    apiV1.route(`/${group.name}`, plannedGroupRouter(group));
  }

  return apiV1;
}
