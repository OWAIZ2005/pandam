/**
 * Column helpers shared by every table so timestamp / id conventions stay
 * identical across the schema. SQLite (Cloudflare D1) has no native enum or
 * `DEFAULT now()`, so:
 *  - ids are application-generated `text` primary keys (see `../id.ts`),
 *  - timestamps are epoch milliseconds stored as `integer`,
 *  - `createdAt` defaults in SQL; `updatedAt` is set by the repository layer on
 *    every write (SQLite cannot auto-update a column).
 */
import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

/** Epoch-ms column that defaults to "now" at insert time. */
export const createdAt = integer('created_at')
  .notNull()
  .default(sql`(unixepoch('subsec') * 1000)`);

/** Epoch-ms column the repository layer refreshes on every update. */
export const updatedAt = integer('updated_at')
  .notNull()
  .default(sql`(unixepoch('subsec') * 1000)`);

/** Nullable epoch-ms column (no default) — e.g. `readAt`, `deletedAt`. */
export const nullableTimestamp = (name: string) => integer(name);

/** Non-null epoch-ms column that defaults to "now" at insert time. */
export const timestampNow = (name: string) =>
  integer(name)
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

/** Primary-key id column. Value is generated in app code, never by the DB. */
export const idColumn = text('id').primaryKey();

// Enum value tuples live in ../enums.ts (a dependency-free leaf module) so the
// client bundle never pulls in Drizzle. Re-exported here for schema authors.
export { ITEM_TYPE, PUBLICATION_STATUS, type ItemType, type PublicationStatus } from '../enums';
