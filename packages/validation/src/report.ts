import { boundedString, reportReasonSchema, reportSubjectTypeSchema, z } from './common';

export const createReportSchema = z.object({
  subjectType: reportSubjectTypeSchema,
  /** Prefixed id of the reported entity; the server validates it exists. */
  subjectId: z.string().min(3).max(64),
  reason: reportReasonSchema,
  details: boundedString(1, 2000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createDisputeSchema = z.object({
  transactionId: z.string().regex(/^btx_[0-9a-f]{32}$/),
  reason: boundedString(3, 200),
  details: boundedString(1, 4000).optional(),
});
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
