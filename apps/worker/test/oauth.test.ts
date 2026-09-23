/**
 * Tests for `AuthService#loginWithOAuth` — the account-linking decision made
 * once a provider's ID token has already been verified. Provider signature
 * verification itself (`lib/oauth.ts`) is not exercised here: it only wraps
 * `jose` against Google/Apple's live JWKS endpoints, which a unit test should
 * not depend on network access for. This tests the part PANDAM actually
 * decides: same-subject → same account, verified-email → link, otherwise → a
 * new account; and that account status is still enforced.
 */
import { type VerifiedOAuthIdentity } from '../src/lib/oauth';
import { createRepositories } from '@pandam/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createAuthService } from '../src/services/auth';

import { makeTestDb, type TestDb } from './helpers/db';

let ctx: TestDb;
beforeEach(async () => {
  ctx = await makeTestDb();
});
afterEach(() => ctx.close());

function identity(overrides: Partial<VerifiedOAuthIdentity> = {}): VerifiedOAuthIdentity {
  return { subject: 'google-subject-1', email: 'alice@example.com', emailVerified: true, ...overrides };
}

describe('AuthService#loginWithOAuth', () => {
  it('creates a new account + profile on first sign-in', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);

    const { user, token } = await service.loginWithOAuth(
      'google',
      identity(),
      {},
      'Alice Example',
    );

    expect(user.email).toBe('alice@example.com');
    expect(token).toBeTruthy();
    const profile = await repos.profiles.findByUserId(user.id);
    expect(profile?.displayName).toBe('Alice Example');

    const linked = await repos.oauthIdentities.findByProviderSubject('google', 'google-subject-1');
    expect(linked?.userId).toBe(user.id);
  });

  it('falls back to a generic name when the provider gives none', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);
    const { user } = await service.loginWithOAuth('apple', identity({ subject: 'apple-1' }), {});
    const profile = await repos.profiles.findByUserId(user.id);
    expect(profile?.displayName).toBe('PANDAM member');
  });

  it('the same provider subject signing in again reaches the same account', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);
    const first = await service.loginWithOAuth('google', identity(), {}, 'Alice');
    const second = await service.loginWithOAuth('google', identity(), {});
    expect(second.user.id).toBe(first.user.id);
    // Only one profile/identity row exists — no duplicate account.
    expect(await repos.oauthIdentities.findByUserId(first.user.id)).toHaveLength(1);
  });

  it('links to an existing account when the provider vouches for a matching email', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);

    // An account that registered the ordinary way first.
    const existing = await repos.users.create({ email: 'alice@example.com' });
    await repos.profiles.create({ userId: existing.id, displayName: 'Alice', username: null });

    const { user } = await service.loginWithOAuth('google', identity(), {});
    expect(user.id).toBe(existing.id);

    // Exactly one profile still exists — linking did not create a second one.
    const profiles = await ctx.db.query.profiles.findMany({
      where: (p, { eq }) => eq(p.userId, existing.id),
    });
    expect(profiles).toHaveLength(1);
  });

  it('refuses to link — or silently duplicate — an unverified colliding email', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);
    await repos.users.create({ email: 'alice@example.com' });

    await expect(
      service.loginWithOAuth('google', identity({ emailVerified: false }), {}),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('a verified email with no existing account still creates a fresh one', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);
    const { user } = await service.loginWithOAuth(
      'google',
      identity({ email: 'new@example.com', emailVerified: false }),
      {},
    );
    expect(user.email).toBe('new@example.com');
  });

  it('rejects when the provider gives no email and there is nothing to link', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);
    await expect(
      service.loginWithOAuth('apple', identity({ email: null, emailVerified: false }), {}),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('a suspended account cannot sign in via OAuth either', async () => {
    const repos = createRepositories(ctx.db);
    const service = createAuthService(repos);
    const { user } = await service.loginWithOAuth('google', identity(), {}, 'Alice');
    await repos.users.setStatus(user.id, 'suspended');

    await expect(service.loginWithOAuth('google', identity(), {})).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
