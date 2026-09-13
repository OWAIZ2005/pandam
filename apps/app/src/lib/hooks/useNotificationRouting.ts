/**
 * Makes a tapped push notification land on the right screen.
 *
 * The payload the Worker sends (`services/notify.ts`) carries the related ids,
 * so the routing table here mirrors the one the in-app notification list uses.
 * Anything unrecognised falls back to the notifications screen rather than
 * doing nothing — a tap that appears to be ignored reads as a broken app.
 */
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/lib/auth/hooks';
import { qk } from '@/lib/query/keys';

type PushData = Record<string, unknown>;

/** Where a notification payload should take the user. */
function routeFor(data: PushData): string {
  const str = (key: string) => (typeof data[key] === 'string' ? (data[key] as string) : null);
  const offerId = str('offerId');
  const transactionId = str('transactionId');
  const conversationId = str('conversationId');
  const paymentId = str('paymentId');

  if (conversationId) return `/(app)/chat/${conversationId}`;
  if (offerId) return `/(app)/offer/${offerId}`;
  if (transactionId) return `/(app)/transaction/${transactionId}`;
  if (paymentId) return `/(app)/payment/${paymentId}`;
  return '/(app)/notifications';
}

export function useNotificationRouting(): void {
  const router = useRouter();
  const client = useQueryClient();
  const { isAuthenticated } = useSession();

  useEffect(() => {
    if (!isAuthenticated) return;

    // A push means something changed server-side, so refresh the feed whether
    // the app was opened by the tap or was already in the foreground.
    const received = Notifications.addNotificationReceivedListener(() => {
      void client.invalidateQueries({ queryKey: ['notifications'] });
      void client.invalidateQueries({ queryKey: qk.offers.all });
      void client.invalidateQueries({ queryKey: qk.conversations.all });
    });

    const tapped = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as PushData;
      router.push(routeFor(data) as never);
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [isAuthenticated, client, router]);
}
