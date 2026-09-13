import { idSchema, z } from './common';

/** Buy a `sale`/`both` listing outright — no negotiation, a fixed price. */
export const createPaymentSchema = z.object({
  listingId: idSchema('lst'),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
