import { eq } from 'drizzle-orm';

import { newId } from '../id';
import {
  type BarterTransactionRow,
  type BarterTransactionStatus,
  type NewBarterTransactionRow,
  barterTransactions,
} from '../schema/barter-transactions';

import { type Database, firstOrNull, now, one, touch } from './helpers';

export type CreateBarterTransactionInput = Omit<
  NewBarterTransactionRow,
  'id' | 'status' | 'completedAt' | 'cancelledAt' | 'createdAt' | 'updatedAt'
>;

export function barterTransactionsRepository(db: Database) {
  return {
    async create(input: CreateBarterTransactionInput): Promise<BarterTransactionRow> {
      const rows = await db
        .insert(barterTransactions)
        .values({ ...input, id: newId('barterTransaction'), status: 'created' })
        .returning();
      return one(rows, 'barterTransactions.create');
    },

    async findById(id: string): Promise<BarterTransactionRow | null> {
      const rows = await db
        .select()
        .from(barterTransactions)
        .where(eq(barterTransactions.id, id))
        .limit(1);
      return firstOrNull(rows);
    },

    async findByOffer(offerId: string): Promise<BarterTransactionRow | null> {
      const rows = await db
        .select()
        .from(barterTransactions)
        .where(eq(barterTransactions.offerId, offerId))
        .limit(1);
      return firstOrNull(rows);
    },

    /**
     * Persist a status transition. Validate with `assertBarterTransition`
     * (Worker domain layer) first. Sets `completedAt` / `cancelledAt` markers.
     */
    async applyStatus(
      id: string,
      status: BarterTransactionStatus,
    ): Promise<BarterTransactionRow | null> {
      const stamp =
        status === 'completed'
          ? { completedAt: now() }
          : status === 'cancelled'
            ? { cancelledAt: now() }
            : {};
      const rows = await db
        .update(barterTransactions)
        .set({ status, ...stamp, ...touch() })
        .where(eq(barterTransactions.id, id))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type BarterTransactionsRepository = ReturnType<typeof barterTransactionsRepository>;
