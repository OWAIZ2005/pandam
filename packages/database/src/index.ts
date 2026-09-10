/**
 * @pandam/database — Drizzle schema, D1 client, and the repository layer.
 *
 *   import { createDb, createRepositories } from '@pandam/database';
 *   const db = createDb(env.DB);
 *   const repos = createRepositories(db);
 */
export { createDb, schema, type Database } from './client';
export * as tables from './schema/index';

export * from './schema/index';
export * from './id';
export * from './repositories';
export * from './seed';
