import { idSchema, itemTypeSchema, z } from './common';

/** Query params for `GET /api/v1/{listings,needs}` discovery. */
export const discoverQuerySchema = z.object({
  category: idSchema('cat').optional(),
  type: itemTypeSchema.optional(),
  q: z.string().trim().min(1).max(80).optional(),
  owner: idSchema('usr').optional(),
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type DiscoverQuery = z.infer<typeof discoverQuerySchema>;
