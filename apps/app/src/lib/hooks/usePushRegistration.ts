/**
 * Keeps this device's push token registered to whoever is signed in.
 *
 * It never prompts: registration only happens when permission was ALREADY
 * granted (see `lib/push/token`), so the permission dialog is shown by a
 * screen where the user chose it rather than on first launch. A device that
 * cannot receive push — simulator, web, permission denied — ends here
 * silently, because the in-app notification feed is the real channel.
 */
import { useEffect, useRef } from 'react';

import { useSession } from '@/lib/auth/hooks';
import { registerPushToken, resolvePushToken } from '@/lib/push/token';

export function usePushRegistration(): void {
  const { user } = useSession();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      registeredFor.current = null;
      return;
    }
    // The same phone can be handed to a second account, so re-register when
    // the signed-in user changes — the server moves the token across.
    if (registeredFor.current === user.id) return;

    let cancelled = false;
    void (async () => {
      const token = await resolvePushToken();
      if (!token || cancelled) return;
      // Left unset on failure, so the next mount tries again.
      if (await registerPushToken(token)) registeredFor.current = user.id;
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
