import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { NOTIFICATION_TYPE, type NotificationType } from '../enums';

import { createdAt, idColumn, nullableTimestamp } from './_shared';
import { users } from './users';

export { NOTIFICATION_TYPE, type NotificationType };

/**
 * A domain notification for a user. Delivery (push, email, in-app realtime) is
 * a later phase — this table is only the durable record and read state.
 * `data` is a small JSON string of related ids (e.g. `{ "offerId": "ofr_..." }`).
 */
export const notifications = sqliteTable(
  'notifications',
  {
    id: idColumn,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: NOTIFICATION_TYPE }).notNull(),
    data: text('data'),
    readAt: nullableTimestamp('read_at'),
    createdAt,
  },
  (t) => [
    index('notifications_user_idx').on(t.userId, t.createdAt),
    index('notifications_user_unread_idx').on(t.userId, t.readAt),
  ],
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
