import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { PUSH_PLATFORM, type PushPlatform } from '../enums';

import { createdAt, idColumn, nullableTimestamp, updatedAt } from './_shared';
import { users } from './users';

export { PUSH_PLATFORM, type PushPlatform };

/**
 * An Expo push token for one installation of the app.
 *
 * The token identifies a device, not a person: the same phone can be handed
 * to a second account, so the token is UNIQUE and re-registering it moves it
 * to the current user rather than creating a duplicate. A token Expo reports
 * as dead is soft-disabled (`disabledAt`) instead of deleted, so a device that
 * comes back re-registers into the same row.
 */
export const pushTokens = sqliteTable(
  'push_tokens',
  {
    id: idColumn,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** `ExponentPushToken[…]`, issued by Expo's push service. */
    token: text('token').notNull(),
    platform: text('platform', { enum: PUSH_PLATFORM }).notNull(),
    /** Set when Expo reports the token as unregistered; cleared on re-register. */
    disabledAt: nullableTimestamp('disabled_at'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('push_tokens_token_key').on(t.token),
    index('push_tokens_user_idx').on(t.userId),
  ],
);

export type PushTokenRow = typeof pushTokens.$inferSelect;
export type NewPushTokenRow = typeof pushTokens.$inferInsert;
