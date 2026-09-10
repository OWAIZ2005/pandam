/**
 * Sentry initialisation. No-ops unless EXPO_PUBLIC_SENTRY_DSN is set, so local
 * development stays quiet. Call `initMonitoring()` once from the root layout.
 */
import * as Sentry from '@sentry/react-native';

import { clientEnv } from './env';

let started = false;

export function initMonitoring(): void {
  if (started || !clientEnv.sentryDsn) return;
  Sentry.init({
    dsn: clientEnv.sentryDsn,
    environment: clientEnv.env,
    tracesSampleRate: clientEnv.env === 'production' ? 0.2 : 1.0,
    enabled: true,
  });
  started = true;
}

export { Sentry };
