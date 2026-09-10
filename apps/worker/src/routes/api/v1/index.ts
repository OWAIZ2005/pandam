/**
 * PANDAM API v1.
 *
 * `GET /api/v1` returns a machine-readable description of the surface. Only the
 * read-only `categories` and `matches` groups are implemented in this phase;
 * every other group is mounted and returns `501 not_implemented` with the
 * standard error envelope (see `./planned.ts`).
 */
import { Hono } from 'hono';

import { type AppBindings } from '../../../env';
import { sendOk } from '../../../lib/http';

import { categoriesRoute } from './categories';
import { matchesRoute } from './matches';
import { PLANNED_GROUPS, plannedGroupRouter } from './planned';

export const apiV1 = new Hono<AppBindings>();

const IMPLEMENTED = [
  {
    name: 'categories',
    summary: 'Curated categories (normalised matching key)',
    endpoints: ['GET /'],
  },
  { name: 'matches', summary: 'Deterministic reciprocal barter candidates', endpoints: ['GET /'] },
];

apiV1.get('/', (c) =>
  sendOk(c, {
    version: 'v1',
    implemented: IMPLEMENTED,
    planned: PLANNED_GROUPS.map(({ name, summary, endpoints }) => ({ name, summary, endpoints })),
    notes: [
      'Authentication is not implemented yet; non-production accepts a dev x-pandam-user-id header.',
      'AI matching, credits, payments and multi-party barter are explicitly out of scope for V1.',
    ],
  }),
);

apiV1.route('/categories', categoriesRoute);
apiV1.route('/matches', matchesRoute);

for (const group of PLANNED_GROUPS) {
  apiV1.route(`/${group.name}`, plannedGroupRouter(group));
}
