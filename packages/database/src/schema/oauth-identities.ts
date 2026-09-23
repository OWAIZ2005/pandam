import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { OAUTH_PROVIDER, type OAuthProvider } from '../enums';

import { createdAt, idColumn } from './_shared';
import { users } from './users';

export { OAUTH_PROVIDER, type OAuthProvider };

/**
 * A linked social identity ("Sign in with Google/Apple"). Split from `users`
 * for the same reason as `credentials`: a user may have a password, one or
 * more OAuth identities, or both, without reshaping the identity record.
 *
 * `providerUserId` is the provider's stable subject (`sub` claim) — never the
 * email, which can change. `email` is a point-in-time record of what the
 * provider reported at link time, used only for the one-time "does an account
 * with this email already exist" linking decision during first sign-in; it is
 * never re-checked against it afterwards.
 *
 * `ON DELETE cascade` — deleting the user drops their linked identities.
 */
export const oauthIdentities = sqliteTable(
  'oauth_identities',
  {
    id: idColumn,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: OAUTH_PROVIDER }).notNull(),
    /** The provider's `sub` claim — stable, opaque, never reused across accounts. */
    providerUserId: text('provider_user_id').notNull(),
    email: text('email'),
    createdAt,
  },
  (t) => [
    uniqueIndex('oauth_identities_provider_subject_unique').on(t.provider, t.providerUserId),
    uniqueIndex('oauth_identities_user_provider_unique').on(t.userId, t.provider),
  ],
);

export type OAuthIdentityRow = typeof oauthIdentities.$inferSelect;
export type NewOAuthIdentityRow = typeof oauthIdentities.$inferInsert;
