/**
 * Authentication service — the one place that knows how registration, login,
 * session validation and logout actually work. It orchestrates the repository
 * layer and the crypto helpers; it does not know about HTTP.
 *
 * Security properties enforced here:
 *  - passwords are only ever stored as PBKDF2 hashes (see lib/crypto)
 *  - login returns a single generic error and runs a constant-cost dummy verify
 *    for unknown accounts, so it cannot be used to enumerate emails
 *  - session tokens are random 256-bit values; only their SHA-256 hash is stored
 *  - a suspended/deleted user cannot authenticate even with a live session
 */
import { type Repositories, type SessionRow, type UserRow } from '@pandam/database';
import { type LoginInput, type RegisterInput } from '@pandam/validation';

import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  needsRehash,
  verifyPassword,
} from '../lib/crypto';
import { ApiError } from '../lib/http';

/** 30 days. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Generic login failure — never says which part was wrong. */
const INVALID_CREDENTIALS = 'Invalid email or password';

/**
 * A well-formed hash the dummy verify runs against for unknown accounts, so a
 * missing user costs the same CPU as a wrong password. Value is irrelevant.
 */
const DUMMY_HASH = `pbkdf2$sha256$210000$${'A'.repeat(22)}$${'A'.repeat(43)}`;

export interface RequestMeta {
  userAgent?: string | null;
}

export interface AuthResult {
  user: UserRow;
  session: SessionRow;
  /** Raw token — returned to the caller once, never stored. */
  token: string;
}

export interface AuthenticatedContext {
  user: UserRow;
  session: SessionRow;
}

export function createAuthService(repos: Repositories) {
  async function issueSession(
    userId: string,
    meta: RequestMeta,
  ): Promise<SessionRow & { token: string }> {
    const token = generateSessionToken();
    const tokenHash = await hashSessionToken(token);
    const session = await repos.sessions.create({
      userId,
      tokenHash,
      expiresAt: Date.now() + SESSION_TTL_MS,
      userAgent: meta.userAgent ?? null,
    });
    return Object.assign(session, { token });
  }

  return {
    async register(input: RegisterInput, meta: RequestMeta): Promise<AuthResult> {
      const email = input.email.trim().toLowerCase();

      if (await repos.users.findByEmail(email)) {
        throw new ApiError('conflict', 'An account with that email already exists.', {
          email: ['already registered'],
        });
      }
      if (input.username && (await repos.profiles.findByUsername(input.username))) {
        throw new ApiError('conflict', 'That username is taken.', {
          username: ['already taken'],
        });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await repos.users.create({ email });
      await repos.credentials.create(user.id, passwordHash);
      await repos.profiles.create({
        userId: user.id,
        displayName: input.displayName,
        username: input.username ?? null,
      });

      const session = await issueSession(user.id, meta);
      return { user, session, token: session.token };
    },

    async login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
      const email = input.email.trim().toLowerCase();
      const user = await repos.users.findByEmail(email);
      const credential = user ? await repos.credentials.findByUserId(user.id) : null;

      // Always run a verify so timing does not distinguish "no such user".
      const passwordOk = await verifyPassword(
        input.password,
        credential?.passwordHash ?? DUMMY_HASH,
      );

      if (!user || !credential || !passwordOk) {
        throw new ApiError('unauthorized', INVALID_CREDENTIALS);
      }
      if (user.status !== 'active') {
        throw new ApiError('forbidden', 'This account is not active.');
      }

      if (needsRehash(credential.passwordHash)) {
        try {
          await repos.credentials.updateHash(user.id, await hashPassword(input.password));
        } catch {
          // Non-fatal: the login still succeeds with the old (valid) hash.
        }
      }

      const session = await issueSession(user.id, meta);
      return { user, session, token: session.token };
    },

    /** Resolve a raw bearer/cookie token to a live session + active user. */
    async authenticate(rawToken: string): Promise<AuthenticatedContext | null> {
      if (!rawToken) return null;
      const tokenHash = await hashSessionToken(rawToken);
      const session = await repos.sessions.findLiveByTokenHash(tokenHash);
      if (!session) return null;

      const user = await repos.users.findById(session.userId);
      if (!user || user.status !== 'active') return null;

      try {
        await repos.sessions.touchLastUsed(session.id);
      } catch {
        // best-effort
      }
      return { user, session };
    },

    async logout(sessionId: string): Promise<void> {
      await repos.sessions.revoke(sessionId);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
