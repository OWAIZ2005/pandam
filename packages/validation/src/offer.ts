import { boundedString, idSchema, z } from './common';

/**
 * Create a barter offer: "I give you my `offeredListingId` for your
 * `requestedListingId`". `matchId` is optional (offers can also be made
 * straight from search).
 */
export const createOfferSchema = z.object({
  toUserId: idSchema('usr'),
  offeredListingId: idSchema('lst'),
  requestedListingId: idSchema('lst'),
  matchId: idSchema('mch').optional(),
  message: boundedString(1, 2000).optional(),
  /** Epoch-ms; must be in the future when present. */
  expiresAt: z.number().int().positive().optional(),
});
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

/** The recipient's response, or the sender cancelling. */
export const respondToOfferSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel']),
});
export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;
