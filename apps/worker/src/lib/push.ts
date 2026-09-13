/**
 * Expo push delivery.
 *
 * PANDAM has no push credentials of its own: the app registers with Expo's
 * push service and we POST to `exp.host`, which fans out to APNs/FCM. That
 * keeps Apple/Google keys out of this codebase entirely.
 *
 * Two rules this module exists to enforce:
 *  1. A push is a *copy* of a notification row, never the source of truth.
 *     Delivery failures are logged and swallowed — the in-app feed is what
 *     the user actually relies on, and a dead device must never fail the
 *     request that triggered it.
 *  2. Tokens Expo reports as `DeviceNotRegistered` are handed back to the
 *     caller so they can be disabled, otherwise we keep paying to push at
 *     phones that uninstalled the app.
 */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Expo caps a single request at 100 messages. */
const BATCH_SIZE = 100;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  /** Deep-link payload the app reads in its notification handler. */
  data?: Record<string, string>;
  /** Unread count to show on the app icon. */
  badge?: number;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export interface PushResult {
  sent: number;
  /** Tokens Expo says are no longer registered — disable these. */
  deadTokens: string[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Send messages through Expo. Never throws: every failure mode returns a
 * result, because the notification row is already committed by the time this
 * runs and there is nothing useful for a caller to do with an exception.
 */
export async function sendExpoPush(
  messages: PushMessage[],
  accessToken?: string,
): Promise<PushResult> {
  const result: PushResult = { sent: 0, deadTokens: [] };
  if (messages.length === 0) return result;

  for (const batch of chunk(messages, BATCH_SIZE)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          // Only needed once push security is enabled on the Expo project;
          // absent it, Expo accepts unauthenticated sends for the project.
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(batch.map((m) => ({ ...m, sound: 'default', priority: 'high' }))),
      });

      if (!res.ok) {
        console.warn('[push] Expo rejected a batch', res.status, await res.text().catch(() => ''));
        continue;
      }

      const body = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = body.data ?? [];
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'ok') {
          result.sent += 1;
          return;
        }
        const token = batch[i]?.to;
        if (ticket.details?.error === 'DeviceNotRegistered' && token) {
          result.deadTokens.push(token);
        } else {
          console.warn('[push] ticket error', ticket.details?.error, ticket.message);
        }
      });
    } catch (error) {
      // Network failure to Expo. The in-app notification still exists.
      console.warn('[push] send failed', error);
    }
  }
  return result;
}
