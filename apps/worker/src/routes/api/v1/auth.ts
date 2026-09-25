/**
 * `/api/v1/auth` — real session authentication.
 *
 *   POST /register   create account + profile + session
 *   POST /login      authenticate + session
 *   POST /oauth      "Sign in with Google/Apple" + session (new or existing)
 *   POST /logout      revoke the current session (idempotent)
 *   GET  /me          the authenticated user + profile
 *
 * Responses never contain a password hash or a session token hash. `register`,
 * `login` and `oauth` return the raw session `token` once (for native clients)
 * AND set the HttpOnly `pandam_session` cookie (for web).
 */
import { type AuthSession, type AuthenticatedUser } from '@pandam/types';
import { loginSchema, oauthLoginSchema, registerSchema } from '@pandam/validation';
import { Hono } from 'hono';

import { clearSessionCookie, setSessionCookie } from '../../../lib/cookies';
import { sendOk } from '../../../lib/http';
import { verifyAppleIdToken, verifyGoogleIdToken } from '../../../lib/oauth';
import { toPublicProfile, toSafeUser } from '../../../lib/serialize';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { createAuthService } from '../../../services/auth';
import { type AppEnv } from '../../../types';

export const authRoute = new Hono<AppEnv>();

authRoute.post('/register', async (c) => {
  const input = await parseBody(c, registerSchema);
  const { repos } = c.get('ctx');
  const service = createAuthService(repos);

  const { user, session, token } = await service.register(input, {
    userAgent: c.req.header('User-Agent') ?? null,
  });
  const profile = await repos.profiles.findByUserId(user.id);

  setSessionCookie(c, token, session.expiresAt);
  const body: AuthSession = {
    user: toSafeUser(user),
    profile: toPublicProfile(profile),
    token,
    expiresAt: session.expiresAt,
  };
  return sendOk(c, body, 201);
});

authRoute.post('/login', async (c) => {
  const input = await parseBody(c, loginSchema);
  const { repos } = c.get('ctx');
  const service = createAuthService(repos);

  const { user, session, token } = await service.login(input, {
    userAgent: c.req.header('User-Agent') ?? null,
  });
  const profile = await repos.profiles.findByUserId(user.id);

  setSessionCookie(c, token, session.expiresAt);
  const body: AuthSession = {
    user: toSafeUser(user),
    profile: toPublicProfile(profile),
    token,
    expiresAt: session.expiresAt,
  };
  return sendOk(c, body);
});

authRoute.post('/oauth', async (c) => {
  const input = await parseBody(c, oauthLoginSchema);
  const { repos } = c.get('ctx');

  const verified =
    input.provider === 'google'
      ? await verifyGoogleIdToken(input.idToken, input.nonce, c.env)
      : await verifyAppleIdToken(input.idToken, input.nonce, c.env);

  const service = createAuthService(repos);
  const { user, session, token } = await service.loginWithOAuth(
    input.provider,
    verified,
    { userAgent: c.req.header('User-Agent') ?? null },
    input.displayName,
  );
  const profile = await repos.profiles.findByUserId(user.id);

  setSessionCookie(c, token, session.expiresAt);
  const body: AuthSession = {
    user: toSafeUser(user),
    profile: toPublicProfile(profile),
    token,
    expiresAt: session.expiresAt,
  };
  return sendOk(c, body);
});

// Logout is valid whether or not a live session exists — always 200.
authRoute.post('/logout', authMiddleware, async (c) => {
  const auth = c.get('auth');
  if (auth) {
    await createAuthService(c.get('ctx').repos).logout(auth.session.id);
  }
  clearSessionCookie(c);
  return sendOk(c, { loggedOut: true });
});

authRoute.get('/me', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const profile = await c.get('ctx').repos.profiles.findByUserId(user.id);
  const body: AuthenticatedUser = {
    user: toSafeUser(user),
    profile: toPublicProfile(profile),
  };
  return sendOk(c, body);
});
