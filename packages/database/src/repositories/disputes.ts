import { desc, eq } from 'drizzle-orm';

import { newId } from '../id';
import { type DisputeRow, type NewDisputeRow, disputes } from '../schema/disputes';

import { type Database, one } from './helpers';

export type CreateDisputeInput = Omit<
  NewDisputeRow,
  'id' | 'status' | 'resolutionNote' | 'createdAt' | 'updatedAt'
>;

export function disputesRepository(db: Database) {
  return {
    async create(input: CreateDisputeInput): Promise<DisputeRow> {
      const rows = await db
        .insert(disputes)
        .values({ ...input, id: newId('dispute') })
        .returning();
      return one(rows, 'disputes.create');
    },

    async listByTransaction(transactionId: string): Promise<DisputeRow[]> {
      return db
        .select()
        .from(disputes)
        .where(eq(disputes.transactionId, transactionId))
        .orderBy(desc(disputes.createdAt));
    },
  };
}

export type DisputesRepository = ReturnType<typeof disputesRepository>;
