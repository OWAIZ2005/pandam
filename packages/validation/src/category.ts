/**
 * A member-created category. Letters/numbers required (so it can produce a
 * slug); spaces collapsed; 2–32 characters so it fits a category tile.
 */
import { z } from './common';

export const createCategorySchema = z.object({
  name: z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(2, 'must be at least 2 characters')
        .max(32, 'must be at most 32 characters')
        .refine((v) => /[A-Za-z0-9]/.test(v), { message: 'must contain letters or numbers' }),
    ),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
