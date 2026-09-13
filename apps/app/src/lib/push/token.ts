/**
 * This device's Expo push token, and the calls that register or drop it.
 *
 * Split out from `usePushRegistration` on purpose: sign-out needs to drop the
 * token, and the sign-out hook lives in `lib/auth/hooks`. If that reached into
 * the registration hook (which reads the session) the two modules would import
 * each other. Nothing in here knows about auth state.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationsApi } from '@/lib/api/notifications';

/** The token this installation last registered with the API. */
let currentToken: string | null = null;

export function pushPlatform(): 'ios' | 'android' | 'web' {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
}

/**
 * Ask Expo for this device's push token. Returns `null` for every reason a
 * device legitimately cannot have one — simulator, web, permission not
 * granted, no EAS credentials — rather than throwing, because none of those
 * are errors the user should ever see.
 */
export async function resolvePushToken(): Promise<string | null> {
  if (!Device.isDevice || Platform.OS === 'web') return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    // Expo needs the EAS project id to mint a token for a standalone build.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
  } catch {
    return null;
  }
}

/** Register a token with the API and remember it. Returns whether it stuck. */
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    await notificationsApi.registerPushToken({ token, platform: pushPlatform() });
    currentToken = token;
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt for notification permission and register. Call this from a screen,
 * in response to the user choosing to turn notifications on — never on first
 * launch, because iOS only ever asks once and a cold prompt gets denied.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!Device.isDevice || Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
  } catch {
    return false;
  }
  const token = await resolvePushToken();
  return token ? registerPushToken(token) : false;
}

/** Whether this device currently has permission to show notifications. */
export async function hasPushPermission(): Promise<boolean> {
  if (!Device.isDevice || Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Whether this device could receive push at all. Used to decide whether to
 * offer the opt-in — there is no point asking on a simulator or on web.
 */
export function pushSupported(): boolean {
  return Device.isDevice && Platform.OS !== 'web';
}

/** Stop pushing to this device. Called on sign-out; never throws. */
export async function unregisterPushToken(): Promise<void> {
  if (!currentToken) return;
  try {
    await notificationsApi.unregisterPushToken({ token: currentToken, platform: pushPlatform() });
  } catch {
    // Signing out must succeed whether or not the server heard about it.
  }
  currentToken = null;
}
