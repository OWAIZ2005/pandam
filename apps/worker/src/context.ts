/**
 * Per-request context: a typed database client, the repository layer, and the
 * (optional) authenticated user id.
 *
 * AUTHENTICATION IS NOT IMPLEMENTED IN THIS PHASE. A later, separate phase adds
 * a real provider and resolves the user from a verified token. To let the API
 * structure be exercised now, a **development-only** `x-pandam-user-id` header
 * is honoured when `PANDAM_ENV !== 'production'`. In production that header is
 * ignored and protected routes simply have no user.
 */
import { createDb, createRepositories, type Database, type Repositories } from '@pandam/database';
import { type Context } from 'hono';

import { type Env } from './env';
import { ApiError } from './lib/http';

export interface RequestContext {
  env: Env;
  db: Database;
  repos: Repositories;
  /** Resolved user id, or `null` when the request is unauthenticated. */
  userId: string | null;
}

/**
 * Resolve the caller's user id without touching the database. Returns `null`
 * unless a valid dev header is present in a non-production environment.
 */
export function resolveUserId(c: Context<{ Bindings: Env }>): string | null {
  if (c.env.PANDAM_ENV === 'production') return null;
  const header = c.req.header('x-pandam-user-id');
  return header && /^usr_[0-9a-f]{32}$/.test(header) ? header : null;
}

/** Require an authenticated user or throw `unauthorized`. */
export function requireUserId(c: Context<{ Bindings: Env }>): string {
  const userId = resolveUserId(c);
  if (!userId) throw new ApiError('unauthorized', 'Authentication is required for this route.');
  return userId;
}

/** Build the DB-backed request context, or throw `db_unavailable`. */
export function buildContext(c: Context<{ Bindings: Env }>): RequestContext {
  const env = c.env;
  if (!env.DB) {
    throw new ApiError(
      'db_unavailable',
      'The D1 binding "DB" is not configured. Provision pandam-db and enable it in wrangler.jsonc.',
    );
  }
  const db = createDb(env.DB);
  return { env, db, repos: createRepositories(db), userId: resolveUserId(c) };
}
