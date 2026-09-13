/**
 * Client environment. Only `EXPO_PUBLIC_*` values are readable in the bundle;
 * none of these are secret. Parsed once here so the rest of the app gets a
 * typed object instead of touching `process.env` directly.
 */
import Constants from 'expo-constants';

type ClientEnv = {
  apiUrl: string;
  wsUrl: string;
  env: 'development' | 'preview' | 'production';
  sentryDsn: string | null;
  posthogKey: string | null;
  posthogHost: string;
};

/** Worker port used by `pnpm dev:worker`. */
const DEV_API_PORT = 8787;

/**
 * Host the JS bundle was served from — `192.168.0.4` on a phone running Expo
 * Go, `localhost` in a web browser.
 *
 * Deriving the dev API host this way (instead of pinning one value in `.env`)
 * is what lets the same build talk to the Worker from both surfaces: a phone
 * cannot reach `localhost`, and a desktop browser often cannot reach the LAN
 * address. Hard-coding either one breaks the other.
 */
function devHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost ??
    null;
  const host = hostUri?.split(':')[0]?.trim();
  return host ? host : null;
}

function required(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

const derivedHost = devHost() ?? 'localhost';

export const clientEnv: ClientEnv = {
  apiUrl: required(process.env.EXPO_PUBLIC_API_URL, `http://${derivedHost}:${DEV_API_PORT}`),
  wsUrl: required(process.env.EXPO_PUBLIC_WS_URL, `ws://${derivedHost}:${DEV_API_PORT}`),
  env: (process.env.EXPO_PUBLIC_ENV as ClientEnv['env']) || 'development',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || null,
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || null,
  posthogHost: required(process.env.EXPO_PUBLIC_POSTHOG_HOST, 'https://us.i.posthog.com'),
};
