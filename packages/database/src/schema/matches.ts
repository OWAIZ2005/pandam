import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { MATCH_STATUS, type MatchStatus } from '../enums';

import { createdAt, idColumn, updatedAt } from './_shared';
import { listings } from './listings';
import { needs } from './needs';
import { users } from './users';

/**
 * `candidate` — surfaced to both users by the deterministic matcher.
 * `dismissed` — a user hid it; it stays recorded so it is not re-surfaced.
 */
export { MATCH_STATUS, type MatchStatus };

/**
 * A **direct reciprocal** barter candidate between two users:
 *
 *   user A HAS `aListingId`   which   user B NEEDS (`bNeedId`)
 *   user B HAS `bListingId`   which   user A NEEDS (`aNeedId`)
 *
 * There is no score. Compatibility is computed deterministically by the matcher
 * (`apps/worker/src/domain/matching.ts`) from category + type equality; this
 * table only *persists discovered candidates* so users can dismiss them and so
 * an offer can point back at the exact four items. `userAId < userBId`
 * (lexicographic) is enforced by convention when inserting, making the row for
 * a pair canonical regardless of who ran discovery.
 */
export const matches = sqliteTable(
  'matches',
  {
    id: idColumn,
    userAId: text('user_a_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userBId: text('user_b_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    aListingId: text('a_listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    bNeedId: text('b_need_id')
      .notNull()
      .references(() => needs.id, { onDelete: 'cascade' }),
    bListingId: text('b_listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    aNeedId: text('a_need_id')
      .notNull()
      .references(() => needs.id, { onDelete: 'cascade' }),
    status: text('status', { enum: MATCH_STATUS }).notNull().default('candidate'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('matches_items_unique').on(t.aListingId, t.bNeedId, t.bListingId, t.aNeedId),
    index('matches_user_a_idx').on(t.userAId, t.status),
    index('matches_user_b_idx').on(t.userBId, t.status),
  ],
);

export type MatchRow = typeof matches.$inferSelect;
export type NewMatchRow = typeof matches.$inferInsert;
