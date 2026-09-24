import { asc, eq } from 'drizzle-orm';

import { newId } from '../id';
import { type CategoryRow, categories } from '../schema/categories';

import { type Database, firstOrNull, one } from './helpers';

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

    /** A member-created category; sorts after the curated set, before "Other". */
    async create(input: { name: string; slug: string }): Promise<CategoryRow> {
      const rows = await db
        .insert(categories)
        .values({ id: newId('category'), name: input.name, slug: input.slug, sortOrder: 500 })
        .returning();
      return one(rows, 'categories.create');
    },

    async findBySlug(slug: string): Promise<CategoryRow | null> {
      const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
      return firstOrNull(rows);
    },
  };
}

export type CategoriesRepository = ReturnType<typeof categoriesRepository>;
