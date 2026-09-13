import { asc, eq, inArray } from 'drizzle-orm';

import { MAX_LISTING_IMAGES } from '../enums';
import { newId } from '../id';
import {
  type ListingImageRow,
  type NewListingImageRow,
  listingImages,
} from '../schema/listing-images';

import { type Database, firstOrNull, one } from './helpers';

export type AddListingImageInput = Omit<NewListingImageRow, 'id' | 'createdAt'>;

/** Hard cap per listing, enforced by the route before it writes to R2. */
export const MAX_IMAGES_PER_LISTING = MAX_LISTING_IMAGES;

export function listingImagesRepository(db: Database) {
  return {
    /**
     * Store image metadata. The object itself is written to R2 by the Worker
     * first, so a row here always points at bytes that exist.
     */
    async add(input: AddListingImageInput): Promise<ListingImageRow> {
      const rows = await db
        .insert(listingImages)
        .values({ ...input, id: newId('listingImage') })
        .returning();
      return one(rows, 'listingImages.add');
    },

    async findById(id: string): Promise<ListingImageRow | null> {
      const rows = await db.select().from(listingImages).where(eq(listingImages.id, id)).limit(1);
      return firstOrNull(rows);
    },

    async listByListing(listingId: string): Promise<ListingImageRow[]> {
      return db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId))
        .orderBy(asc(listingImages.sortOrder), asc(listingImages.createdAt));
    },

    /**
     * Images for many listings in ONE query, grouped by listing id. The
     * discovery feed needs photos for every row it returns, and doing that
     * per row would be a query per card.
     */
    async listByListings(listingIds: string[]): Promise<Map<string, ListingImageRow[]>> {
      const map = new Map<string, ListingImageRow[]>();
      if (listingIds.length === 0) return map;
      const rows = await db
        .select()
        .from(listingImages)
        .where(inArray(listingImages.listingId, listingIds))
        .orderBy(asc(listingImages.sortOrder), asc(listingImages.createdAt));
      for (const row of rows) {
        const list = map.get(row.listingId);
        if (list) list.push(row);
        else map.set(row.listingId, [row]);
      }
      return map;
    },

    /** Next free `sortOrder`, so uploads append rather than collide at 0. */
    async nextSortOrder(listingId: string): Promise<number> {
      const existing = await this.listByListing(listingId);
      const last = existing[existing.length - 1];
      return last ? last.sortOrder + 1 : 0;
    },

    async countForListing(listingId: string): Promise<number> {
      return (await this.listByListing(listingId)).length;
    },

    async remove(id: string): Promise<void> {
      await db.delete(listingImages).where(eq(listingImages.id, id));
    },
  };
}

export type ListingImagesRepository = ReturnType<typeof listingImagesRepository>;
