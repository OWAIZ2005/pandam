/**
 * Loads the persisted native session token into memory before the rest of the
 * app renders, so the very first `me` request already carries the Bearer
 * header. On web this resolves instantly (the cookie does the work).
 */
import { type ReactNode, useEffect, useState } from 'react';

import { Splash } from '@/components/Splash';
import { sessionToken } from '@/lib/session/storage';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    sessionToken.load().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <Splash />;
  return <>{children}</>;
}
