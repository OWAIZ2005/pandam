import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { CATEGORY_STATUS, type CategoryStatus } from '../enums';

import { createdAt, idColumn, updatedAt } from './_shared';

export { CATEGORY_STATUS, type CategoryStatus };

/**
 * A stable, curated category used to classify listings and needs.
 *
 * `slug` is the normalised matching key: "Web Design", "web design" and
 * "WEB DESIGN" all map to the single category `web-design`. Core matching keys
 * off `categoryId` (never off free-form title text). Categories are seed data
 * (see `../seed.ts`); adding one is a migration/seed change, not a user action.
 */
export const categories = sqliteTable(
  'categories',
  {
    id: idColumn,
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: text('status', { enum: CATEGORY_STATUS }).notNull().default('active'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex('categories_slug_unique').on(t.slug)],
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
