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

export const PLANNED_GROUPS: PlannedGroup[] = [
  {
    name: 'users',
    summary: 'Account management (email change, delete account, session list)',
    endpoints: ['DELETE /me', 'GET /me/sessions', 'POST /me/change-password'],
  },
  {
    name: 'offers',
    summary: 'Barter proposals between two users',
    endpoints: ['GET /incoming', 'GET /outgoing', 'POST /', 'GET /:id', 'POST /:id/respond'],
  },
  {
    name: 'conversations',
    summary: 'Negotiation threads (realtime delivery is a later phase)',
    endpoints: ['GET /', 'GET /:id', 'POST /:id/read'],
  },
  {
    name: 'messages',
    summary: 'Messages within a conversation',
    endpoints: ['GET /conversations/:id/messages', 'POST /conversations/:id/messages'],
  },
  {
    name: 'transactions',
    summary: 'Barter transactions (non-monetary) created from accepted offers',
    endpoints: ['GET /', 'GET /:id', 'POST /:id/status'],
  },
  {
    name: 'reviews',
    summary: 'Reviews left after a completed barter',
    endpoints: ['GET /users/:userId/reviews', 'POST /'],
  },
  {
    name: 'notifications',
    summary: 'Per-user notification feed',
    endpoints: ['GET /', 'POST /:id/read'],
  },
  {
    name: 'reports',
    summary: 'Abuse reports and transaction disputes',
    endpoints: ['POST /', 'POST /disputes'],
  },
];

export function plannedGroupRouter(group: PlannedGroup) {
  const router = new Hono<AppEnv>();
  router.all('*', (c) => notImplemented(c, `/api/v1/${group.name}`));
  return router;
}
