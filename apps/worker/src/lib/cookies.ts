/**
 * Session cookie handling.
 *
 * Web clients rely entirely on this HttpOnly cookie — the session token is
 * never exposed to page JavaScript or stored in `localStorage`. Native clients
 * ignore the cookie and use the `token` from the response body with an
 * `Authorization: Bearer` header instead.
 *
 * `SameSite=None; Secure` so the cookie works when the web app and the API are
 * on different origins (the common dev + simple-deploy setup). A same-site
 * production deployment (`app.pandam.app` + `api.pandam.app` sharing
 * `Domain=.pandam.app`) can tighten this to `Lax`; see docs/architecture/auth.md.
 */
import { type Context } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';

import { type AppEnv } from '../types';

export const SESSION_COOKIE = 'pandam_session';

export function setSessionCookie(c: Context<AppEnv>, token: string, expiresAt: number): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true, sameSite: 'None' });
}
