import { boundedString, idSchema, z } from './common';

/**
 * A review is always submitted against a completed barter transaction. The
 * server additionally checks the reviewer was a party to it and has not already
 * reviewed — see the Worker's review domain module.
 */
export const createReviewSchema = z.object({
  transactionId: idSchema('btx'),
  rating: z.number().int().min(1).max(5),
  comment: boundedString(1, 2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const transactionStatusUpdateSchema = z.object({
  action: z.enum(['start', 'complete', 'cancel']),
});
export type TransactionStatusUpdateInput = z.infer<typeof transactionStatusUpdateSchema>;
