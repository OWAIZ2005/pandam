/**
 * Client environment. Only `EXPO_PUBLIC_*` values are readable in the bundle;
 * none of these are secret. Parsed once here so the rest of the app gets a
 * typed object instead of touching `process.env` directly.
 */
type ClientEnv = {
  apiUrl: string;
  wsUrl: string;
  env: 'development' | 'preview' | 'production';
  sentryDsn: string | null;
  posthogKey: string | null;
  posthogHost: string;
};

function required(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const clientEnv: ClientEnv = {
  apiUrl: required(process.env.EXPO_PUBLIC_API_URL, 'http://localhost:8787'),
  wsUrl: required(process.env.EXPO_PUBLIC_WS_URL, 'ws://localhost:8787'),
  env: (process.env.EXPO_PUBLIC_ENV as ClientEnv['env']) || 'development',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || null,
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || null,
  posthogHost: required(process.env.EXPO_PUBLIC_POSTHOG_HOST, 'https://us.i.posthog.com'),
};
