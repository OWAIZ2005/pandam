import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { createdAt, idColumn } from './_shared';
import { barterTransactions } from './barter-transactions';
import { users } from './users';

/**
 * A review left after a barter. Integrity is structural:
 *  - `transactionId` FK — a review cannot exist without a real transaction,
 *  - UNIQUE (transactionId, reviewerId) — one review per party per transaction,
 *  - CHECK reviewer <> reviewee,
 *  - CHECK rating between 1 and 5.
 * The repository additionally requires the transaction to be `completed` and
 * the reviewer to be a party to it.
 */
export const reviews = sqliteTable(
  'reviews',
  {
    id: idColumn,
    transactionId: text('transaction_id')
      .notNull()
      .references(() => barterTransactions.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    revieweeId: text('reviewee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt,
  },
  (t) => [
    uniqueIndex('reviews_txn_reviewer_unique').on(t.transactionId, t.reviewerId),
    check('reviews_rating_range', sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    check('reviews_distinct_parties', sql`${t.reviewerId} <> ${t.revieweeId}`),
    index('reviews_reviewee_idx').on(t.revieweeId),
  ],
);

export type ReviewRow = typeof reviews.$inferSelect;
export type NewReviewRow = typeof reviews.$inferInsert;
