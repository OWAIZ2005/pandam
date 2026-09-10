import { and, desc, eq } from 'drizzle-orm';

import { newId } from '../id';
import { type NewOfferRow, type OfferRow, type OfferStatus, offers } from '../schema/offers';

import { type Database, firstOrNull, now, one, touch } from './helpers';

export type CreateOfferInput = Omit<
  NewOfferRow,
  'id' | 'status' | 'respondedAt' | 'createdAt' | 'updatedAt'
>;

export function offersRepository(db: Database) {
  return {
    async create(input: CreateOfferInput): Promise<OfferRow> {
      const rows = await db
        .insert(offers)
        .values({ ...input, id: newId('offer'), status: 'pending' })
        .returning();
      return one(rows, 'offers.create');
    },

    async findById(id: string): Promise<OfferRow | null> {
      const rows = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
      return firstOrNull(rows);
    },

    async listIncoming(userId: string, status?: OfferStatus): Promise<OfferRow[]> {
      const where = status
        ? and(eq(offers.toUserId, userId), eq(offers.status, status))
        : eq(offers.toUserId, userId);
      return db.select().from(offers).where(where).orderBy(desc(offers.createdAt));
    },

    async listOutgoing(userId: string, status?: OfferStatus): Promise<OfferRow[]> {
      const where = status
        ? and(eq(offers.fromUserId, userId), eq(offers.status, status))
        : eq(offers.fromUserId, userId);
      return db.select().from(offers).where(where).orderBy(desc(offers.createdAt));
    },

    /**
     * Persist a status transition. Callers MUST validate the transition with
     * `assertOfferTransition` (Worker domain layer) first; this method only
     * writes and stamps `respondedAt` for terminal responses.
     */
    async applyStatus(id: string, status: OfferStatus): Promise<OfferRow | null> {
      const respondedAt = status === 'pending' ? undefined : now();
      const rows = await db
        .update(offers)
        .set({ status, ...(respondedAt ? { respondedAt } : {}), ...touch() })
        .where(eq(offers.id, id))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type OffersRepository = ReturnType<typeof offersRepository>;
