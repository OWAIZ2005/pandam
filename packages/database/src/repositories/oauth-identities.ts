import { and, eq } from 'drizzle-orm';

import { newId } from '../id';
import { type OAuthIdentityRow, type OAuthProvider, oauthIdentities } from '../schema/oauth-identities';

import { type Database, firstOrNull, one } from './helpers';

export interface CreateOAuthIdentityInput {
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  email: string | null;
}

export function oauthIdentitiesRepository(db: Database) {
  return {
    async create(input: CreateOAuthIdentityInput): Promise<OAuthIdentityRow> {
      const rows = await db
        .insert(oauthIdentities)
        .values({ id: newId('oauthIdentity'), ...input })
        .returning();
      return one(rows, 'oauthIdentities.create');
    },

    /** Look up the linked account for a provider's stable subject id. */
    async findByProviderSubject(
      provider: OAuthProvider,
      providerUserId: string,
    ): Promise<OAuthIdentityRow | null> {
      const rows = await db
        .select()
        .from(oauthIdentities)
        .where(
          and(
            eq(oauthIdentities.provider, provider),
            eq(oauthIdentities.providerUserId, providerUserId),
          ),
        )
        .limit(1);
      return firstOrNull(rows);
    },

    async findByUserId(userId: string): Promise<OAuthIdentityRow[]> {
      return db.select().from(oauthIdentities).where(eq(oauthIdentities.userId, userId));
    },
  };
}

export type OAuthIdentitiesRepository = ReturnType<typeof oauthIdentitiesRepository>;
