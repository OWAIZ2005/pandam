import { and, desc, eq, gt, isNull } from 'drizzle-orm';

import { newId } from '../id';
import { type SessionRow, sessions } from '../schema/sessions';

import { type Database, firstOrNull, now, one } from './helpers';

export interface CreateSessionInput {
  userId: string;
  /** SHA-256(rawToken) hex — the raw token is never passed here. */
  tokenHash: string;
  /** Epoch ms. */
  expiresAt: number;
  userAgent?: string | null;
}

export function sessionsRepository(db: Database) {
  return {
    async create(input: CreateSessionInput): Promise<SessionRow> {
      const rows = await db
        .insert(sessions)
        .values({
          id: newId('session'),
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          userAgent: input.userAgent ?? null,
        })
        .returning();
      return one(rows, 'sessions.create');
    },

    /** The session for this token hash IF it is live (not expired, not revoked). */
    async findLiveByTokenHash(tokenHash: string): Promise<SessionRow | null> {
      const rows = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.tokenHash, tokenHash),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, now()),
          ),
        )
        .limit(1);
      return firstOrNull(rows);
    },

    async findById(id: string): Promise<SessionRow | null> {
      const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return firstOrNull(rows);
    },

    /** Refresh `lastUsedAt` only if it is stale, to avoid a write per request. */
    async touchLastUsed(id: string, thresholdMs = 5 * 60_000): Promise<void> {
      const session = await this.findById(id);
      if (!session) return;
      const last = session.lastUsedAt ?? session.createdAt;
      if (now() - last < thresholdMs) return;
      await db.update(sessions).set({ lastUsedAt: now() }).where(eq(sessions.id, id));
    },

    /**
     * Every session for a user, newest first, including expired and revoked
     * ones — the account screen shows history, and hiding revoked rows would
     * make "was I signed out?" unanswerable.
     */
    async listForUser(userId: string): Promise<SessionRow[]> {
      return db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.createdAt));
    },

    async revoke(id: string): Promise<void> {
      await db
        .update(sessions)
        .set({ revokedAt: now() })
        .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
    },

    async revokeAllForUser(userId: string): Promise<void> {
      await db
        .update(sessions)
        .set({ revokedAt: now() })
        .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
    },
  };
}

export type SessionsRepository = ReturnType<typeof sessionsRepository>;
