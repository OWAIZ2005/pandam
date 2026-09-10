import { and, eq, or } from 'drizzle-orm';

import { newId } from '../id';
import { type MatchRow, type NewMatchRow, matches } from '../schema/matches';

import { type Database, firstOrNull, one, touch } from './helpers';

export type UpsertMatchInput = Omit<NewMatchRow, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export function matchesRepository(db: Database) {
  return {
    /**
     * Record a discovered reciprocal candidate. Idempotent on the four-item
     * unique key: if the same candidate is rediscovered, the existing row is
     * returned unchanged.
     */
    async upsertCandidate(input: UpsertMatchInput): Promise<MatchRow> {
      const existing = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.aListingId, input.aListingId),
            eq(matches.bNeedId, input.bNeedId),
            eq(matches.bListingId, input.bListingId),
            eq(matches.aNeedId, input.aNeedId),
          ),
        )
        .limit(1);
      const found = firstOrNull(existing);
      if (found) return found;

      const rows = await db
        .insert(matches)
        .values({ ...input, id: newId('match'), status: 'candidate' })
        .returning();
      return one(rows, 'matches.upsertCandidate');
    },

    async listForUser(userId: string): Promise<MatchRow[]> {
      return db
        .select()
        .from(matches)
        .where(
          and(
            or(eq(matches.userAId, userId), eq(matches.userBId, userId)),
            eq(matches.status, 'candidate'),
          ),
        );
    },

    async dismiss(id: string): Promise<MatchRow | null> {
      const rows = await db
        .update(matches)
        .set({ status: 'dismissed', ...touch() })
        .where(eq(matches.id, id))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type MatchesRepository = ReturnType<typeof matchesRepository>;
