/**
 * Database client abstraction.
 *
 * The Worker passes its `env.DB` (a D1 binding) to `createDb()` and gets back a
 * Drizzle instance bound to the PANDAM schema. Route/service code never touches
 * `drizzle()` directly and only ever sees the `Database` type below.
 *
 * `Database` is the driver-agnostic SQLite surface (`BaseSQLiteDatabase`), not
 * the D1-specific type, so the same repositories run unchanged against a
 * synchronous `better-sqlite3` instance in tests. Every repository awaits its
 * queries, which is a no-op for the sync driver.
 */
import { drizzle } from 'drizzle-orm/d1';
import { type BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import * as schema from './schema/index';

export type Schema = typeof schema;

/** Driver-agnostic typed database. Satisfied by D1 and better-sqlite3 alike. */
export type Database = BaseSQLiteDatabase<'sync' | 'async', unknown, Schema>;

export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema, logger: false }) as unknown as Database;
}

export { schema };
