import { type NotificationView } from '@pandam/types';
import { type RegisterPushTokenInput } from '@pandam/validation';

import { api } from './client';

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get<{ items: NotificationView[] }>(
      `/api/v1/notifications${unreadOnly ? '?unread=true' : ''}`,
    ),
  markRead: (id: string) => api.post<{ read: true }>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.post<{ read: number }>('/api/v1/notifications/read-all'),

  /** Register this installation for push; safe to call on every cold start. */
  registerPushToken: (input: RegisterPushTokenInput) =>
    api.post<{ registered: true }>('/api/v1/notifications/tokens', input),

  /** Called on sign-out so the next account on this phone is not pushed to. */
  unregisterPushToken: (input: RegisterPushTokenInput) =>
    api.delete<{ removed: true }>('/api/v1/notifications/tokens', input),
};
