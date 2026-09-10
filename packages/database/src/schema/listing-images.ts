import { integer, index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, idColumn } from './_shared';
import { listings } from './listings';

/**
 * Metadata for an image attached to a listing. The binary lives in Cloudflare
 * R2; this row only stores the object key and ordering. Uploading to R2 is a
 * later phase — nothing here touches object storage.
 */
export const listingImages = sqliteTable(
  'listing_images',
  {
    id: idColumn,
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    /** Key of the object in the R2 media bucket. */
    objectKey: text('object_key').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt,
  },
  (t) => [index('listing_images_listing_idx').on(t.listingId, t.sortOrder)],
);

export type ListingImageRow = typeof listingImages.$inferSelect;
export type NewListingImageRow = typeof listingImages.$inferInsert;
