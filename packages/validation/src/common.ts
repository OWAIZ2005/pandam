/**
 * Shared Zod primitives used across the PANDAM domain schemas. Enum tuples are
 * imported from `@pandam/database/enums` (a dependency-free leaf module) so the
 * schema and the validation stay in lock-step without pulling Drizzle into the
 * client bundle.
 */
import {
  ITEM_TYPE,
  PUBLICATION_STATUS,
  REPORT_REASON,
  REPORT_SUBJECT_TYPE,
} from '@pandam/database/enums';
import { z } from 'zod';

export { z };
export type { ZodError, ZodIssue, ZodSchema, ZodTypeAny } from 'zod';

/** Cursor pagination shared by every list endpoint. */
export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Trimmed, length-bounded string. */
export const boundedString = (min: number, max: number) => z.string().trim().min(min).max(max);

/** A PANDAM prefixed id, e.g. `usr_…`, `lst_…` (32 lowercase hex after `_`). */
export const idSchema = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[0-9a-f]{32}$`), `must be a valid ${prefix}_ id`);

export const environmentSchema = z.enum(['development', 'preview', 'production']);
export const platformSchema = z.enum(['ios', 'android', 'web']);

/* Domain enums as Zod schemas (single source: @pandam/database/enums) */
export const itemTypeSchema = z.enum(ITEM_TYPE);
export const publicationStatusSchema = z.enum(PUBLICATION_STATUS);
export const reportReasonSchema = z.enum(REPORT_REASON);
export const reportSubjectTypeSchema = z.enum(REPORT_SUBJECT_TYPE);

/** Fields the client may set for a listing/need's publication state. */
export const publishableStatusSchema = z.enum(['draft', 'published', 'paused', 'archived']);
