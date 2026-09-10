import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ITEM_TYPE, PUBLICATION_STATUS, createdAt, idColumn, updatedAt } from './_shared';
import { categories } from './categories';
import { users } from './users';

/**
 * "I HAVE" — something a user offers for barter: a product, a service or a
 * skill. Matching keys off (`categoryId`, `type`); `title`/`description` are
 * human-facing only.
 */
export const listings = sqliteTable(
  'listings',
  {
    id: idColumn,
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    type: text('type', { enum: ITEM_TYPE }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status', { enum: PUBLICATION_STATUS }).notNull().default('draft'),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('listings_owner_idx').on(t.ownerId),
    index('listings_category_idx').on(t.categoryId),
    // Primary discovery index: find published HAVEs by (category, type).
    index('listings_match_idx').on(t.status, t.categoryId, t.type),
  ],
);

export type ListingRow = typeof listings.$inferSelect;
export type NewListingRow = typeof listings.$inferInsert;
