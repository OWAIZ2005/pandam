import { asc, eq } from 'drizzle-orm';

import { newId } from '../id';
import {
  type ListingImageRow,
  type NewListingImageRow,
  listingImages,
} from '../schema/listing-images';

import { type Database, one } from './helpers';

export type AddListingImageInput = Omit<NewListingImageRow, 'id' | 'createdAt'>;

export function listingImagesRepository(db: Database) {
  return {
    /** Store image metadata only. Uploading the object to R2 is a later phase. */
    async add(input: AddListingImageInput): Promise<ListingImageRow> {
      const rows = await db
        .insert(listingImages)
        .values({ ...input, id: newId('listingImage') })
        .returning();
      return one(rows, 'listingImages.add');
    },

    async listByListing(listingId: string): Promise<ListingImageRow[]> {
      return db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId))
        .orderBy(asc(listingImages.sortOrder));
    },

    async remove(id: string): Promise<void> {
      await db.delete(listingImages).where(eq(listingImages.id, id));
    },
  };
}

export type ListingImagesRepository = ReturnType<typeof listingImagesRepository>;
