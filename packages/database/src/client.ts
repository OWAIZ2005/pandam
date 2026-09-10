/**
 * D1 client abstraction.
 *
 * The Worker passes its `env.DB` (a D1Database binding) to `createDb()` and
 * gets back a typed Drizzle instance bound to the PANDAM schema. Keeping this
 * in one place means route/service code never touches `drizzle()` directly and
 * we can swap drivers (e.g. a local better-sqlite3 for tests) later without a
 * wide refactor.
 */
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';

import * as schema from './schema/index';

export type Database = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema, logger: false });
}

export { schema };
