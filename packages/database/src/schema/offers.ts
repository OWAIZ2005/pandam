import { sql } from 'drizzle-orm';
import { check, index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { OFFER_STATUS, type OfferStatus } from '../enums';

import { createdAt, idColumn, nullableTimestamp, updatedAt } from './_shared';
import { listings } from './listings';
import { matches } from './matches';
import { needs } from './needs';
import { users } from './users';

export { OFFER_STATUS, type OfferStatus };

/**
 * A proposal from one user to another for a direct barter:
 * "I give you my `offeredListingId`, in exchange for your `requestedListingId`".
 *
 * `matchId` links the offer back to the discovered candidate when there is one
 * (offers can also be made directly from search). Lifecycle:
 *
 *   pending ─▶ accepted | rejected | cancelled | expired
 *
 * Only `pending` is non-terminal. An accepted offer is what a barter
 * transaction is created from.
 */
export const offers = sqliteTable(
  'offers',
  {
    id: idColumn,
    matchId: text('match_id').references(() => matches.id, { onDelete: 'set null' }),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The `from` user's HAVE being offered. */
    offeredListingId: text('offered_listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    /**
     * What the offer is FOR — exactly one of these is set: the `to` user's
     * HAVE (a listing), or the `to` user's I NEED request (a need) that the
     * offered listing would fulfil.
     */
    requestedListingId: text('requested_listing_id').references(() => listings.id, {
      onDelete: 'cascade',
    }),
    requestedNeedId: text('requested_need_id').references(() => needs.id, {
      onDelete: 'cascade',
    }),
    /** Optional photo the sender attached (R2 key under `offers/<fromUserId>/`). */
    imageKey: text('image_key'),
    message: text('message'),
    status: text('status', { enum: OFFER_STATUS }).notNull().default('pending'),
    expiresAt: nullableTimestamp('expires_at'),
    respondedAt: nullableTimestamp('responded_at'),
    createdAt,
    updatedAt,
  },
  (t) => [
    check('offers_distinct_parties', sql`${t.fromUserId} <> ${t.toUserId}`),
    check('offers_distinct_listings', sql`${t.offeredListingId} <> ${t.requestedListingId}`),
    check(
      'offers_single_target',
      sql`(${t.requestedListingId} IS NULL) <> (${t.requestedNeedId} IS NULL)`,
    ),
    index('offers_to_user_idx').on(t.toUserId, t.status),
    index('offers_from_user_idx').on(t.fromUserId, t.status),
    index('offers_match_idx').on(t.matchId),
  ],
);

export type OfferRow = typeof offers.$inferSelect;
export type NewOfferRow = typeof offers.$inferInsert;
