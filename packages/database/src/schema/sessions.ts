import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { createdAt, idColumn, nullableTimestamp, timestampNow } from './_shared';
import { users } from './users';

/**
 * A server-side session. The raw session token is a 32-byte random value shown
 * to the client exactly once (login/register response body + Set-Cookie);
 * only its SHA-256 hash is stored here, so a database leak does not hand an
 * attacker usable tokens.
 *
 * A session is valid iff `expiresAt > now` AND `revokedAt IS NULL`. Logout sets
 * `revokedAt`. `lastUsedAt` is refreshed lazily (not on every request).
 *
 * `ON DELETE cascade` — deleting the user drops their sessions.
 */
export const sessions = sqliteTable(
  'sessions',
  {
    id: idColumn,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256(rawToken), hex. Unique — the lookup key. */
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestampNow('expires_at'),
    createdAt,
    lastUsedAt: nullableTimestamp('last_used_at'),
    revokedAt: nullableTimestamp('revoked_at'),
    /** Coarse client hint for a future "your sessions" screen. Not trusted. */
    userAgent: text('user_agent'),
  },
  (t) => [
    uniqueIndex('sessions_token_hash_unique').on(t.tokenHash),
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
);

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
