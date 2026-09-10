import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Internal key/value metadata (schema version marker, seed flags, etc.). */
export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export type MetaRow = typeof meta.$inferSelect;
export type NewMetaRow = typeof meta.$inferInsert;
