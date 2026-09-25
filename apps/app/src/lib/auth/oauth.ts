/**
 * "Continue with Google" / "Continue with Apple" — native, on-device sign-in
 * that hands the Worker a signed ID token to verify (see
 * `apps/worker/src/lib/oauth.ts`). PANDAM never sees, stores or transmits a
 * Google/Apple password; the provider authenticates the person entirely on
 * their own device/browser, and all we receive back is a token.
 *
 * Both flows generate a random `nonce` and thread it through so the ID token
 * we get back cannot be a replay of one issued for a different sign-in
 * attempt (the Worker checks the token's `nonce` claim against this exact
 * value — see `@pandam/validation#oauthLoginSchema`).
 *
 * WHY EACH FLOW LOOKS DIFFERENT:
 *  - Google uses `expo-auth-session`, a pure-JS system-browser flow. It needs
 *    no native module, so it works the same in Expo Go and a real build.
 *  - Apple sign-in is only meaningful on Apple platforms and Apple requires
 *    it be presented as their own native button/sheet — that is
 *    `expo-apple-authentication`, a native module. It is NOT available in
 *    Expo Go (Expo Go only bundles a fixed set of native modules); it needs
 *    a custom EAS development/production build. `isAppleSignInAvailable()`
 *    lets the UI hide the button rather than fail when it is missing.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { clientEnv } from '@/lib/env';

// Lets a web redirect-back tab close itself and hand control back to the app.
// A no-op on native. Safe to call once at module load.
WebBrowser.maybeCompleteAuthSession();

export type OAuthSignInResult = {
  idToken: string;
  nonce: string;
  displayName?: string;
} | null; // null = the user cancelled/dismissed — not an error.

async function randomNonce(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(24);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Best-effort read of the Google ID token's `name` claim, purely for a nicer
 * default display name on a brand-new account. This does NOT verify the
 * token — the Worker does that from scratch — so a forged value here can, at
 * worst, put a silly name on an account the forger already fully controls.
 */
function unsafeReadName(idToken: string): string | undefined {
  try {
    const payloadB64 = idToken.split('.')[1];
    if (!payloadB64) return undefined;
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { name?: unknown };
    return typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim()
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Opens Google's sign-in in the system browser (Chrome Custom Tab / Safari
 * View Controller / a popup on web) and resolves the verified-by-Google ID
 * token. Requires `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` (web) or
 * `EXPO_PUBLIC_GOOGLE_CLIENT_ID_NATIVE` (iOS/Android) to be set — see
 * `docs/architecture/auth.md` for how to create them in Google Cloud Console.
 */
export async function signInWithGoogle(): Promise<OAuthSignInResult> {
  const clientId =
    Platform.OS === 'web'
      ? clientEnv.googleOAuthClientId.web
      : clientEnv.googleOAuthClientId.native;
  if (!clientId) {
    throw new Error('Google sign-in is not configured for this build yet.');
  }

  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
  const redirectUri = AuthSession.makeRedirectUri({ path: 'oauthredirect' });
  const nonce = await randomNonce();

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    extraParams: { nonce },
  });

  const result = await request.promptAsync(discovery);
  if (result.type === 'dismiss' || result.type === 'cancel') return null;
  if (result.type !== 'success' || typeof result.params.id_token !== 'string') {
    throw new Error(result.type === 'error' ? result.error?.message : 'Google sign-in failed.');
  }

  const idToken = result.params.id_token;
  return { idToken, nonce, displayName: unsafeReadName(idToken) };
}

/** True only where Apple's native sign-in sheet can actually appear. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    // Thrown when the native module isn't linked at all (plain Expo Go) —
    // the caller should treat this exactly like "not available".
    return false;
  }
}

/**
 * Apple's native sign-in sheet. `fullName` is handed back ONLY on the very
 * first authorization for this app — capture it into `displayName` right
 * here, because it is gone on every subsequent sign-in.
 */
export async function signInWithApple(): Promise<OAuthSignInResult> {
  const rawNonce = await randomNonce();
  // Apple requires the *hashed* nonce in the request; the ID token it returns
  // then carries that same hashed value in its `nonce` claim — so the value
  // we compare against later is the hash, not `rawNonce`.
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === 'ERR_REQUEST_CANCELED') return null;
    throw err;
  }

  if (!credential.identityToken) {
    throw new Error('Apple did not return a usable sign-in token.');
  }

  const displayName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
    : undefined;

  return {
    idToken: credential.identityToken,
    nonce: hashedNonce,
    displayName: displayName || undefined,
  };
}
