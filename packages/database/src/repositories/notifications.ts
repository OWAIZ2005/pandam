import { and, desc, eq, isNull } from 'drizzle-orm';

import { newId } from '../id';
import {
  type NotificationRow,
  type NotificationType,
  notifications,
} from '../schema/notifications';

import { type Database, firstOrNull, now, one } from './helpers';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  /** Small structured context (related ids). Serialised to JSON. */
  data?: Record<string, string> | null;
}

export function notificationsRepository(db: Database) {
  return {
    async create(input: CreateNotificationInput): Promise<NotificationRow> {
      const rows = await db
        .insert(notifications)
        .values({
          id: newId('notification'),
          userId: input.userId,
          type: input.type,
          data: input.data ? JSON.stringify(input.data) : null,
        })
        .returning();
      return one(rows, 'notifications.create');
    },

    async findById(id: string): Promise<NotificationRow | null> {
      const rows = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      return firstOrNull(rows);
    },

    async listForUser(userId: string, unreadOnly = false): Promise<NotificationRow[]> {
      const where = unreadOnly
        ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
        : eq(notifications.userId, userId);
      return db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt));
    },

    async markRead(id: string): Promise<NotificationRow | null> {
      const rows = await db
        .update(notifications)
        .set({ readAt: now() })
        .where(eq(notifications.id, id))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type NotificationsRepository = ReturnType<typeof notificationsRepository>;
