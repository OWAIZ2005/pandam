import { and, eq, isNull } from 'drizzle-orm';

import { newId } from '../id';
import { type PushPlatform, type PushTokenRow, pushTokens } from '../schema/push-tokens';

import { type Database, firstOrNull, now, one, touch } from './helpers';

export interface RegisterPushTokenInput {
  userId: string;
  token: string;
  platform: PushPlatform;
}

export function pushTokensRepository(db: Database) {
  return {
    /**
     * Idempotent registration. The token is unique per device, so if it is
     * already on file it is re-pointed at the current user and re-enabled —
     * that is what happens when someone signs out and a second account signs
     * in on the same phone.
     */
    async register(input: RegisterPushTokenInput): Promise<PushTokenRow> {
      const existing = await this.findByToken(input.token);
      if (existing) {
        const rows = await db
          .update(pushTokens)
          .set({
            userId: input.userId,
            platform: input.platform,
            disabledAt: null,
            ...touch(),
          })
          .where(eq(pushTokens.id, existing.id))
          .returning();
        return one(rows, 'pushTokens.register');
      }
      const rows = await db
        .insert(pushTokens)
        .values({
          id: newId('pushToken'),
          userId: input.userId,
          token: input.token,
          platform: input.platform,
        })
        .returning();
      return one(rows, 'pushTokens.register');
    },

    async findByToken(token: string): Promise<PushTokenRow | null> {
      const rows = await db.select().from(pushTokens).where(eq(pushTokens.token, token)).limit(1);
      return firstOrNull(rows);
    },

    /** Live tokens for a user — the fan-out list for one notification. */
    async listActiveForUser(userId: string): Promise<PushTokenRow[]> {
      return db
        .select()
        .from(pushTokens)
        .where(and(eq(pushTokens.userId, userId), isNull(pushTokens.disabledAt)));
    },

    /** Called when Expo reports `DeviceNotRegistered` for a token. */
    async disableByToken(token: string): Promise<void> {
      await db
        .update(pushTokens)
        .set({ disabledAt: now(), ...touch() })
        .where(eq(pushTokens.token, token));
    },

    /** Sign-out on this device: drop the row entirely. */
    async removeByToken(userId: string, token: string): Promise<void> {
      await db
        .delete(pushTokens)
        .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
    },
  };
}

export type PushTokensRepository = ReturnType<typeof pushTokensRepository>;
