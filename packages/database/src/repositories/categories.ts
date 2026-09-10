import { asc, eq } from 'drizzle-orm';

import { type CategoryRow, categories } from '../schema/categories';

import { type Database, firstOrNull } from './helpers';

export function categoriesRepository(db: Database) {
  return {
    async listActive(): Promise<CategoryRow[]> {
      return db
        .select()
        .from(categories)
        .where(eq(categories.status, 'active'))
        .orderBy(asc(categories.sortOrder), asc(categories.name));
    },

    async findById(id: string): Promise<CategoryRow | null> {
      const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
      return firstOrNull(rows);
    },

    async findBySlug(slug: string): Promise<CategoryRow | null> {
      const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
      return firstOrNull(rows);
    },
  };
}

export type CategoriesRepository = ReturnType<typeof categoriesRepository>;
