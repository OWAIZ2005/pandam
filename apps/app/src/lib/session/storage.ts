/**
 * Session token storage — platform-aware.
 *
 *  - Web: nothing is stored. The API sets an HttpOnly `pandam_session` cookie
 *    that the browser sends automatically; page JavaScript cannot read it, and
 *    we deliberately keep it that way (no token in `localStorage`).
 *  - Native (iOS/Android): the token is kept in the OS keychain / keystore via
 *    `expo-secure-store`, and mirrored in a module variable so the API client
 *    can attach it synchronously as a Bearer header.
 *
 * Call `sessionToken.load()` once at startup before rendering guarded routes.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'pandam.session.token';
const isWeb = Platform.OS === 'web';

let cached: string | null = null;

export const sessionToken = {
  /** Hydrate `cached` from secure storage (native only). */
  async load(): Promise<string | null> {
    if (isWeb) return null;
    try {
      cached = await SecureStore.getItemAsync(KEY);
    } catch {
      cached = null;
    }
    return cached;
  },

  /** Synchronous read for the API client. */
  get(): string | null {
    return cached;
  },

  async set(token: string): Promise<void> {
    cached = token;
    if (!isWeb) {
      try {
        await SecureStore.setItemAsync(KEY, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      } catch {
        // keep the in-memory copy even if the keychain write fails
      }
    }
  },

  async clear(): Promise<void> {
    cached = null;
    if (!isWeb) {
      try {
        await SecureStore.deleteItemAsync(KEY);
      } catch {
        // ignore
      }
    }
  },
};
