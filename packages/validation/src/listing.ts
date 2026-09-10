import { boundedString, idSchema, itemTypeSchema, publishableStatusSchema, z } from './common';

export const createListingSchema = z.object({
  categoryId: idSchema('cat'),
  type: itemTypeSchema,
  title: boundedString(3, 120),
  description: boundedString(10, 4000),
  /** Optional; defaults to `draft` server-side. */
  status: publishableStatusSchema.optional(),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = z
  .object({
    categoryId: idSchema('cat'),
    type: itemTypeSchema,
    title: boundedString(3, 120),
    description: boundedString(10, 4000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'at least one field is required' });
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const setListingStatusSchema = z.object({ status: publishableStatusSchema });
export type SetListingStatusInput = z.infer<typeof setListingStatusSchema>;

/** Attach image metadata to a listing (the R2 upload itself is a later phase). */
export const addListingImageSchema = z.object({
  objectKey: boundedString(1, 512),
  sortOrder: z.number().int().min(0).max(999).default(0),
});
export type AddListingImageInput = z.infer<typeof addListingImageSchema>;
