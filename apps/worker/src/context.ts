/**
 * Per-request context: the typed database client and the repository layer.
 *
 * There is NO dev user-id header any more — identity comes only from a verified
 * session (see `middleware/auth.ts` + `services/auth.ts`). Tests inject a
 * `Database` via `createApp({ db })`; production builds one from `env.DB`.
 */
import { createDb, createRepositories, type Database, type Repositories } from '@pandam/database';
import { type Context } from 'hono';

import { type Env } from './env';
import { ApiError } from './lib/http';
import { type AppEnv } from './types';

export interface RequestContext {
  env: Env;
  db: Database;
  repos: Repositories;
}

export interface AppDeps {
  /** Injected in tests; when absent the context is built from `env.DB`. */
  db?: Database;
}

/** Build the DB-backed request context, or throw `db_unavailable`. */
export function buildContext(c: Context<AppEnv>, deps: AppDeps = {}): RequestContext {
  const env = c.env;
  const db = deps.db ?? (env.DB ? createDb(env.DB) : null);
  if (!db) {
    throw new ApiError(
      'db_unavailable',
      'The D1 binding "DB" is not configured. Provision pandam-db and enable it in wrangler.jsonc.',
    );
  }
  return { env, db, repos: createRepositories(db) };
}
