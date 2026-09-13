import { desc, eq, or } from 'drizzle-orm';

import { newId } from '../id';
import {
  type NewPaymentRow,
  type PaymentRow,
  type PaymentStatus,
  payments,
} from '../schema/payments';

import { type Database, firstOrNull, now, one, touch } from './helpers';

export type CreatePaymentInput = Omit<
  NewPaymentRow,
  | 'id'
  | 'status'
  | 'razorpayPaymentId'
  | 'webhookVerifiedAt'
  | 'paidAt'
  | 'cancelledAt'
  | 'refundedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export function paymentsRepository(db: Database) {
  return {
    async create(input: CreatePaymentInput): Promise<PaymentRow> {
      const rows = await db
        .insert(payments)
        .values({ ...input, id: newId('payment'), status: 'created' })
        .returning();
      return one(rows, 'payments.create');
    },

    async findById(id: string): Promise<PaymentRow | null> {
      const rows = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
      return firstOrNull(rows);
    },

    async findByPaymentLinkId(razorpayPaymentLinkId: string): Promise<PaymentRow | null> {
      const rows = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayPaymentLinkId, razorpayPaymentLinkId))
        .limit(1);
      return firstOrNull(rows);
    },

    /** Every payment where the user is the buyer or the seller. */
    async listForUser(userId: string): Promise<PaymentRow[]> {
      return db
        .select()
        .from(payments)
        .where(or(eq(payments.buyerId, userId), eq(payments.sellerId, userId)))
        .orderBy(desc(payments.createdAt));
    },

    /**
     * Persist a status transition. Validate with `paymentTransition` (Worker
     * domain layer) first. `paid` MUST only be reached via a signature-verified
     * webhook — see `routes/api/v1/payments.ts`.
     */
    async applyStatus(
      id: string,
      status: PaymentStatus,
      extra: { razorpayPaymentId?: string; webhookVerified?: boolean } = {},
    ): Promise<PaymentRow | null> {
      const stamp =
        status === 'paid'
          ? { paidAt: now() }
          : status === 'cancelled'
            ? { cancelledAt: now() }
            : status === 'refunded'
              ? { refundedAt: now() }
              : {};
      const rows = await db
        .update(payments)
        .set({
          status,
          ...stamp,
          ...(extra.razorpayPaymentId ? { razorpayPaymentId: extra.razorpayPaymentId } : {}),
          ...(extra.webhookVerified ? { webhookVerifiedAt: now() } : {}),
          ...touch(),
        })
        .where(eq(payments.id, id))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type PaymentsRepository = ReturnType<typeof paymentsRepository>;
