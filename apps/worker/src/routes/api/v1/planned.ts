/**
 * Route groups whose handlers are a later phase. Each is mounted now so the
 * `/api/v1` surface is real and discoverable, and each documents the endpoints
 * it will expose. They intentionally return `501 not_implemented` rather than
 * fake data.
 */
import { Hono } from 'hono';

import { notImplemented } from '../../../lib/http';
import { type AppEnv } from '../../../types';

export interface PlannedGroup {
  /** Path segment, e.g. `listings`. */
  name: string;
  /** One-line summary shown at `GET /api/v1`. */
  summary: string;
  /** Planned endpoints, for documentation only. */
  endpoints: string[];
}

/**
 * Empty: every V1 resource group now has a real handler. The machinery is
 * kept because it is how the next phase's routes get mounted and documented
 * before they work, rather than 404-ing with no explanation.
 */
export const PLANNED_GROUPS: PlannedGroup[] = [];

export function plannedGroupRouter(group: PlannedGroup) {
  const router = new Hono<AppEnv>();
  router.all('*', (c) => notImplemented(c, `/api/v1/${group.name}`));
  return router;
}
