/**
 * `/api/v1/notifications` — per-user notification feed, read state, and Expo
 * push registration. Email delivery is still a later phase.
 *
 *   GET  /               the caller's notifications (optionally `?unread=true`)
 *   POST /read-all       mark every notification read
 *   POST /:id/read       mark one notification read
 *   POST /tokens         register this device for push
 *   DELETE /tokens       unregister it (called on sign-out)
 *
 * The rows here are the source of truth; a push is only ever a copy of one
 * (see `services/notify.ts`), so a user with push disabled loses nothing but
 * the interruption.
 */
import { type NotificationView } from '@pandam/types';
import { registerPushTokenSchema } from '@pandam/validation';
import { Hono } from 'hono';

import { ApiError, sendOk } from '../../../lib/http';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

export const notificationsRoute = new Hono<AppEnv>();

notificationsRoute.get('/', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const unreadOnly = c.req.query('unread') === 'true';
  const rows = await repos.notifications.listForUser(user.id, unreadOnly);
  const items: NotificationView[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data ? (JSON.parse(n.data) as Record<string, string>) : {},
    read: n.readAt !== null,
    createdAt: n.createdAt,
  }));
  return sendOk(c, { items });
});

notificationsRoute.post('/read-all', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const unread = await repos.notifications.listForUser(user.id, true);
  await Promise.all(unread.map((n) => repos.notifications.markRead(n.id)));
  return sendOk(c, { read: unread.length });
});

/**
 * Register this installation for push. Idempotent: the same token re-posted
 * (every cold start does this) updates the existing row rather than piling up
 * duplicates that would push the same phone twice.
 */
notificationsRoute.post('/tokens', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, registerPushTokenSchema);
  await repos.pushTokens.register({ userId: user.id, ...input });
  return sendOk(c, { registered: true }, 201);
});

/** Sign-out on this device: stop pushing to it. */
notificationsRoute.delete('/tokens', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, registerPushTokenSchema);
  await repos.pushTokens.removeByToken(user.id, input.token);
  return sendOk(c, { removed: true });
});

notificationsRoute.post('/:id/read', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const notification = await repos.notifications.findById(c.req.param('id'));
  if (!notification || notification.userId !== user.id) {
    throw new ApiError('not_found', 'That notification does not exist.');
  }
  await repos.notifications.markRead(notification.id);
  return sendOk(c, { read: true });
});
