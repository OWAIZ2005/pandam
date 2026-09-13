import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { PAYMENT_STATUS, type PaymentStatus } from '../enums';

import { createdAt, idColumn, nullableTimestamp, updatedAt } from './_shared';
import { listings } from './listings';
import { users } from './users';

export { PAYMENT_STATUS, type PaymentStatus };

/**
 * A real-money purchase of a `sale`/`both` listing, backed by a Razorpay
 * Payment Link. This is the ONLY table in the schema that stores an amount or
 * currency for value actually changing hands — every barter table is
 * deliberately moneyless (see `barter_transactions`).
 *
 * PANDAM never touches card/bank details: `razorpayPaymentLinkId` /
 * `razorpayPaymentId` are Razorpay's own references, and `webhookVerifiedAt`
 * records that the `paid` transition came from a signature-verified webhook,
 * never a client callback — a client can claim anything, only Razorpay's HMAC
 * signature is trusted to move status to `paid`.
 *
 *   created ─▶ paid       (webhook, signature-verified)
 *      │  ├──▶ expired    (webhook, or past `expiresAt`)
 *      │  └──▶ cancelled  (buyer/seller, only while `created`)
 *   paid  ─▶ refunded     (seller-initiated, via Razorpay Refunds API)
 */
export const payments = sqliteTable(
  'payments',
  {
    id: idColumn,
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'restrict' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sellerId: text('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Minor currency unit (paise for INR) — an exact integer, never a float. */
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('INR'),
    status: text('status', { enum: PAYMENT_STATUS }).notNull().default('created'),
    /** Razorpay Payment Link id, e.g. `plink_...`. Unique — one link per row. */
    razorpayPaymentLinkId: text('razorpay_payment_link_id').notNull(),
    /** The short, shareable checkout URL returned by Razorpay. */
    razorpayShortUrl: text('razorpay_short_url').notNull(),
    /** Set once Razorpay reports a captured payment against the link. */
    razorpayPaymentId: text('razorpay_payment_id'),
    /** Epoch-ms this record last received a signature-verified webhook. */
    webhookVerifiedAt: nullableTimestamp('webhook_verified_at'),
    expiresAt: nullableTimestamp('expires_at'),
    paidAt: nullableTimestamp('paid_at'),
    cancelledAt: nullableTimestamp('cancelled_at'),
    refundedAt: nullableTimestamp('refunded_at'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('payments_link_unique').on(t.razorpayPaymentLinkId),
    check('payments_amount_positive', sql`${t.amount} > 0`),
    check('payments_distinct_parties', sql`${t.buyerId} <> ${t.sellerId}`),
    index('payments_buyer_idx').on(t.buyerId, t.status),
    index('payments_seller_idx').on(t.sellerId, t.status),
    index('payments_listing_idx').on(t.listingId),
  ],
);

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
