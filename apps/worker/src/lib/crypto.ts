/**
 * Password + session-token cryptography for the PANDAM API.
 *
 * Everything here uses the Web Crypto API (`crypto` / `crypto.subtle`), which is
 * available in the Cloudflare Workers runtime and in Node >= 20 — no
 * dependency, and identical behaviour in tests.
 *
 * Password hashing: PBKDF2-HMAC-SHA-256. Argon2/scrypt would be stronger but
 * need a WASM dependency; PBKDF2 is the pragmatic Workers-native choice. The
 * hash string is self-describing:
 *
 *   pbkdf2$sha256$<iterations>$<salt_b64url>$<hash_b64url>
 *
 * so `PBKDF2_ITERATIONS` can be raised later and `needsRehash()` will ask the
 * login flow to transparently re-hash. See docs/architecture/auth.md.
 */

/** Current work factor. Tune upward as hardware allows; embedded in every hash. */
export const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const HASH_PREFIX = 'pbkdf2$sha256$';

const encoder = new TextEncoder();

function toB64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of view) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** Constant-time comparison of two byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Hash a plaintext password. The plaintext is never stored or logged. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${HASH_PREFIX}${PBKDF2_ITERATIONS}$${toB64Url(salt)}$${toB64Url(hash)}`;
}

/** Verify a plaintext password against a stored hash string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith(HASH_PREFIX)) return false;
  const rest = stored.slice(HASH_PREFIX.length);
  const [iterStr, saltStr, hashStr] = rest.split('$');
  if (!iterStr || !saltStr || !hashStr) return false;
  const iterations = Number.parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const candidate = await pbkdf2(password, fromB64Url(saltStr), iterations);
  return timingSafeEqual(candidate, fromB64Url(hashStr));
}

/** True when a stored hash was made with a weaker work factor than current. */
export function needsRehash(stored: string): boolean {
  if (!stored.startsWith(HASH_PREFIX)) return true;
  const iterStr = stored.slice(HASH_PREFIX.length).split('$')[0];
  const iterations = Number.parseInt(iterStr ?? '0', 10);
  return !Number.isFinite(iterations) || iterations < PBKDF2_ITERATIONS;
}

/* ------------------------------ session tokens ----------------------------- */

const TOKEN_BYTES = 32;

/** A fresh, URL-safe 256-bit session token. Shown to the client exactly once. */
export function generateSessionToken(): string {
  return toB64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
}

/** SHA-256(token) as lowercase hex — this is what the `sessions` table stores. */
export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
