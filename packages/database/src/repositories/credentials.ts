import { eq } from 'drizzle-orm';

import { newId } from '../id';
import { type CredentialRow, credentials } from '../schema/credentials';

import { type Database, firstOrNull, one, touch } from './helpers';

export function credentialsRepository(db: Database) {
  return {
    async create(userId: string, passwordHash: string): Promise<CredentialRow> {
      const rows = await db
        .insert(credentials)
        .values({ id: newId('credential'), userId, passwordHash })
        .returning();
      return one(rows, 'credentials.create');
    },

    async findByUserId(userId: string): Promise<CredentialRow | null> {
      const rows = await db
        .select()
        .from(credentials)
        .where(eq(credentials.userId, userId))
        .limit(1);
      return firstOrNull(rows);
    },

    /** Replace the stored hash (e.g. re-hash on login with stronger params). */
    async updateHash(userId: string, passwordHash: string): Promise<void> {
      await db
        .update(credentials)
        .set({ passwordHash, ...touch() })
        .where(eq(credentials.userId, userId));
    },
  };
}

export type CredentialsRepository = ReturnType<typeof credentialsRepository>;
