/**
 * Read model for discovery. Cross-entity JOIN queries (listing/need + owner +
 * category) live here so the plain `listings` / `needs` repos stay simple CRUD.
 * Every result carries only the *public* slice of the owner.
 */
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { type ItemType, type PublicationStatus } from '../enums';
import { categories } from '../schema/categories';
import { listings } from '../schema/listings';
import { needs } from '../schema/needs';
import { profiles } from '../schema/profiles';

import { type Database, firstOrNull } from './helpers';

export interface OwnerRef {
  id: string;
  displayName: string;
  username: string | null;
}
export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ListingWithRefs {
  id: string;
  ownerId: string;
  categoryId: string;
  type: ItemType;
  title: string;
  description: string;
  status: PublicationStatus;
  createdAt: number;
  updatedAt: number;
  owner: OwnerRef;
  category: CategoryRef;
}
export type NeedWithRefs = ListingWithRefs;

export interface DiscoverFilters {
  categoryId?: string;
  type?: ItemType;
  q?: string;
  ownerId?: string;
  limit: number;
  cursor?: { createdAt: number; id: string } | undefined;
}

/** Escape LIKE wildcards in user input; used with `ESCAPE '\'`. */
function likeArg(q: string): string {
  return `%${q
    .trim()
    .toLowerCase()
    .replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

function selectShape(table: typeof listings | typeof needs) {
  return {
    id: table.id,
    ownerId: table.ownerId,
    categoryId: table.categoryId,
    type: table.type,
    title: table.title,
    description: table.description,
    status: table.status,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
    ownerDisplayName: profiles.displayName,
    ownerUsername: profiles.username,
    categoryName: categories.name,
    categorySlug: categories.slug,
  };
}

type Flat = {
  id: string;
  ownerId: string;
  categoryId: string;
  type: ItemType;
  title: string;
  description: string;
  status: PublicationStatus;
  createdAt: number;
  updatedAt: number;
  ownerDisplayName: string;
  ownerUsername: string | null;
  categoryName: string;
  categorySlug: string;
};

function inflate(r: Flat): ListingWithRefs {
  return {
    id: r.id,
    ownerId: r.ownerId,
    categoryId: r.categoryId,
    type: r.type,
    title: r.title,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    owner: { id: r.ownerId, displayName: r.ownerDisplayName, username: r.ownerUsername },
    category: { id: r.categoryId, name: r.categoryName, slug: r.categorySlug },
  };
}

export function marketRepository(db: Database) {
  function discover(table: typeof listings | typeof needs) {
    return async (f: DiscoverFilters): Promise<ListingWithRefs[]> => {
      const where = [eq(table.status, 'published')];
      if (f.categoryId) where.push(eq(table.categoryId, f.categoryId));
      if (f.type) where.push(eq(table.type, f.type));
      if (f.ownerId) where.push(eq(table.ownerId, f.ownerId));
      if (f.q && f.q.trim()) {
        const arg = likeArg(f.q);
        where.push(
          sql`(lower(${table.title}) like ${arg} escape '\\' or lower(${table.description}) like ${arg} escape '\\')`,
        );
      }
      if (f.cursor) {
        where.push(
          or(
            lt(table.createdAt, f.cursor.createdAt),
            and(eq(table.createdAt, f.cursor.createdAt), lt(table.id, f.cursor.id)),
          )!,
        );
      }
      const rows = (await db
        .select(selectShape(table))
        .from(table)
        .innerJoin(profiles, eq(profiles.userId, table.ownerId))
        .innerJoin(categories, eq(categories.id, table.categoryId))
        .where(and(...where))
        .orderBy(desc(table.createdAt), desc(table.id))
        .limit(f.limit)) as Flat[];
      return rows.map(inflate);
    };
  }

  function ownerList(table: typeof listings | typeof needs) {
    return async (ownerId: string): Promise<ListingWithRefs[]> => {
      const rows = (await db
        .select(selectShape(table))
        .from(table)
        .innerJoin(profiles, eq(profiles.userId, table.ownerId))
        .innerJoin(categories, eq(categories.id, table.categoryId))
        .where(eq(table.ownerId, ownerId))
        .orderBy(desc(table.createdAt), desc(table.id))) as Flat[];
      return rows.map(inflate);
    };
  }

  function getOne(table: typeof listings | typeof needs) {
    return async (id: string): Promise<ListingWithRefs | null> => {
      const rows = (await db
        .select(selectShape(table))
        .from(table)
        .innerJoin(profiles, eq(profiles.userId, table.ownerId))
        .innerJoin(categories, eq(categories.id, table.categoryId))
        .where(eq(table.id, id))
        .limit(1)) as Flat[];
      const row = firstOrNull(rows);
      return row ? inflate(row) : null;
    };
  }

  function byIds(table: typeof listings | typeof needs) {
    return async (ids: string[]): Promise<Map<string, ListingWithRefs>> => {
      const map = new Map<string, ListingWithRefs>();
      if (ids.length === 0) return map;
      const rows = (await db
        .select(selectShape(table))
        .from(table)
        .innerJoin(profiles, eq(profiles.userId, table.ownerId))
        .innerJoin(categories, eq(categories.id, table.categoryId))
        .where(inArray(table.id, ids))) as Flat[];
      for (const r of rows) map.set(r.id, inflate(r));
      return map;
    };
  }

  return {
    discoverListings: discover(listings),
    discoverNeeds: discover(needs),
    listOwnerListings: ownerList(listings),
    listOwnerNeeds: ownerList(needs),
    getListing: getOne(listings),
    getNeed: getOne(needs),
    listingsByIds: byIds(listings),
    needsByIds: byIds(needs),

    /** Published-item counts for a user (home / profile headers). */
    async ownerCounts(ownerId: string): Promise<{ listings: number; needs: number }> {
      const [l, n] = await Promise.all([
        db
          .select({ n: sql<number>`count(*)` })
          .from(listings)
          .where(and(eq(listings.ownerId, ownerId), eq(listings.status, 'published'))),
        db
          .select({ n: sql<number>`count(*)` })
          .from(needs)
          .where(and(eq(needs.ownerId, ownerId), eq(needs.status, 'published'))),
      ]);
      return { listings: Number(l[0]?.n ?? 0), needs: Number(n[0]?.n ?? 0) };
    },
  };
}

export type MarketRepository = ReturnType<typeof marketRepository>;
