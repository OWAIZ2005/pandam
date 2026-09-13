/** TanStack Query hooks for the notification feed. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '@/lib/api/notifications';
import { qk } from '@/lib/query/keys';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: qk.notifications.all(unreadOnly),
    queryFn: async () => (await notificationsApi.list(unreadOnly)).items,
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

export function useUnreadNotificationCount() {
  const q = useNotifications(true);
  return q.data?.length ?? 0;
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
