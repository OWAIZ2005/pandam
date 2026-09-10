/**
 * Test database harness.
 *
 * Auth is security-critical, so its tests run against a REAL SQLite engine
 * (libsql, in-memory, a worker devDependency) with the project's actual Drizzle
 * migrations applied — this exercises the unique constraints, foreign keys and
 * cascades that protect sessions and credentials. libsql is async, like D1, so
 * the repository layer behaves exactly as it does in production.
 *
 * Each call to `makeTestDb()` returns a fresh, isolated database.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@libsql/client';
import { type Database as PandamDatabase, schema } from '@pandam/database';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import { createApp } from '../../src/app';

// this file: apps/worker/test/helpers/db.ts  ->  repo root is four levels up
const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(HERE, '../../../../packages/database/migrations');

export interface TestDb {
  db: PandamDatabase;
  /** A Hono app wired to this database. */
  makeApp: () => ReturnType<typeof createApp>;
  close: () => void;
}

export async function makeTestDb(): Promise<TestDb> {
  const client = createClient({ url: ':memory:' });
  const drizzled = drizzle(client, { schema });
  await migrate(drizzled, { migrationsFolder: MIGRATIONS_DIR });
  await drizzled.run(sql`PRAGMA foreign_keys = ON`);

  const db = drizzled as unknown as PandamDatabase;
  return {
    db,
    makeApp: () => createApp({ db }),
    close: () => client.close(),
  };
}

/** Minimal env for `app.request(path, init, env)` in tests. */
export const testEnv = { PANDAM_ENV: 'development' } as const;
