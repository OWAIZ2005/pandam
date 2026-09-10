import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { DISPUTE_STATUS, type DisputeStatus } from '../enums';

import { createdAt, idColumn, updatedAt } from './_shared';
import { barterTransactions } from './barter-transactions';
import { users } from './users';

export { DISPUTE_STATUS, type DisputeStatus };

/**
 * A dispute raised against a barter transaction. Distinct from `reports`
 * (which are general abuse reports); a dispute always concerns one
 * transaction and has its own resolution lifecycle. No resolution workflow /
 * admin UI is built in this phase.
 */
export const disputes = sqliteTable(
  'disputes',
  {
    id: idColumn,
    transactionId: text('transaction_id')
      .notNull()
      .references(() => barterTransactions.id, { onDelete: 'cascade' }),
    raisedByUserId: text('raised_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status', { enum: DISPUTE_STATUS }).notNull().default('open'),
    resolutionNote: text('resolution_note'),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('disputes_transaction_idx').on(t.transactionId),
    index('disputes_status_idx').on(t.status),
  ],
);

export type DisputeRow = typeof disputes.$inferSelect;
export type NewDisputeRow = typeof disputes.$inferInsert;
