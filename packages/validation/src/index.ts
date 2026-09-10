/**
 * @pandam/validation — shared Zod schemas.
 *
 * Business schemas (listing creation, offer payloads, review submission, ...)
 * will live here so the Expo forms and the Worker handlers validate against the
 * exact same rules. Nothing domain-specific is defined yet — only shared
 * primitives and helpers.
 */
import { z } from 'zod';

export { z };

/** Pagination query shared by every list endpoint. */
export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Non-empty, trimmed, length-bounded string. */
export const boundedString = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Environment name accepted across the platform. */
export const environmentSchema = z.enum(['development', 'preview', 'production']);

/** Client platform reported by the app. */
export const platformSchema = z.enum(['ios', 'android', 'web']);
