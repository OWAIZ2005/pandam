/**
 * PANDAM database schema (Drizzle ORM, Cloudflare D1 / SQLite).
 *
 * The domain tables are intentionally NOT defined yet. They will be added here,
 * one file per aggregate, and re-exported from this barrel:
 *
 *   user, profile, category, subcategory, listing, listingImage, want, offer,
 *   conversation, message, transaction, review, notification, report
 *
 * A single `_meta` table is defined now so the very first migration is
 * non-empty and the client/query pipeline can be exercised end to end.
 */
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Internal key/value metadata (schema version marker, seed flags, etc.). */
export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type MetaRow = typeof meta.$inferSelect;
export type NewMetaRow = typeof meta.$inferInsert;
