/**
 * `/api/v1/users/me` — account management for the signed-in user.
 *
 *   GET    /me/sessions          every session on the account, newest first
 *   POST   /me/sessions/revoke-others  sign out every OTHER device
 *   DELETE /me/sessions/:id      sign out one device
 *   POST   /me/change-password   rotate the password, ending other sessions
 *   DELETE /me                   delete the account
 *
 * Two rules run through all of it:
 *  - The user id always comes from the verified session, so these routes can
 *    only ever act on the caller's own account.
 *  - Anything destructive (new password, account deletion) re-checks the
 *    CURRENT password. A stolen session token alone must not be enough to
 *    lock the real owner out or erase their data.
 */
import { changePasswordSchema, deleteAccountSchema } from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { clearSessionCookie } from '../../../lib/cookies';
import { hashPassword, verifyPassword } from '../../../lib/crypto';
import { ApiError, sendOk } from '../../../lib/http';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

export const usersRoute = new Hono<AppEnv>();

usersRoute.use('*', authMiddleware, requireAuth);

/**
 * Verify the caller really knows their password. Returns nothing; throws
 * `unauthorized` on a mismatch, with the same message either way so it cannot
 * be used to probe whether an account has credentials at all.
 */
async function assertPassword(c: Context<AppEnv>, userId: string, password: string): Promise<void> {
  const { repos } = c.get('ctx');
  const credential = await repos.credentials.findByUserId(userId);
  const ok = credential ? await verifyPassword(password, credential.passwordHash) : false;
  if (!ok) {
    throw new ApiError('unauthorized', 'That password is not correct.', {
      currentPassword: ['is incorrect'],
    });
  }
}

usersRoute.get('/me/sessions', async (c) => {
  const { user, session } = getAuth(c);
  const { repos } = c.get('ctx');
  const rows = await repos.sessions.listForUser(user.id);
  const now = Date.now();
  return sendOk(c, {
    // `tokenHash` is deliberately not in this shape — a session list must not
    // hand out anything that could be replayed.
    items: rows.map((s) => ({
      id: s.id,
      current: s.id === session.id,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      active: s.revokedAt === null && s.expiresAt > now,
    })),
  });
});

usersRoute.delete('/me/sessions/:id', async (c) => {
  const { user, session } = getAuth(c);
  const { repos } = c.get('ctx');
  const target = await repos.sessions.findById(c.req.param('id'));
  // A session belonging to someone else is reported as missing rather than
  // forbidden, so this cannot be used to discover other users' session ids.
  if (!target || target.userId !== user.id) {
    throw new ApiError('not_found', 'That session does not exist.');
  }
  await repos.sessions.revoke(target.id);
  // Revoking your own current session is just a logout — clear the cookie too.
  if (target.id === session.id) clearSessionCookie(c);
  return sendOk(c, { revoked: true, wasCurrent: target.id === session.id });
});

usersRoute.post('/me/sessions/revoke-others', async (c) => {
  const { user, session } = getAuth(c);
  const { repos } = c.get('ctx');
  const rows = await repos.sessions.listForUser(user.id);
  const others = rows.filter((s) => s.id !== session.id && s.revokedAt === null);
  await Promise.all(others.map((s) => repos.sessions.revoke(s.id)));
  return sendOk(c, { revoked: others.length });
});

usersRoute.post('/me/change-password', async (c) => {
  const { user, session } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, changePasswordSchema);
  await assertPassword(c, user.id, input.currentPassword);

  await repos.credentials.updateHash(user.id, await hashPassword(input.newPassword));

  // Changing a password is how someone reacts to a suspected compromise, so
  // every other device is signed out. The current session survives, otherwise
  // the app would bounce the user to the login screen mid-action.
  const rows = await repos.sessions.listForUser(user.id);
  const others = rows.filter((s) => s.id !== session.id && s.revokedAt === null);
  await Promise.all(others.map((s) => repos.sessions.revoke(s.id)));

  return sendOk(c, { changed: true, otherSessionsRevoked: others.length });
});

usersRoute.delete('/me', async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, deleteAccountSchema);
  await assertPassword(c, user.id, input.currentPassword);

  // Soft delete, not a row delete. Barter transactions, reviews and messages
  // involve a second person whose own history must not silently lose its
  // counterparty; `deleted` blocks every future login and hides the account.
  await repos.users.setStatus(user.id, 'deleted');
  await repos.sessions.revokeAllForUser(user.id);

  // Their own items come out of circulation immediately — nobody should be
  // able to make an offer on a listing whose owner is gone.
  const [listings, needs] = await Promise.all([
    repos.market.listOwnerListings(user.id),
    repos.market.listOwnerNeeds(user.id),
  ]);
  await Promise.all([
    ...listings
      .filter((l) => l.status !== 'archived')
      .map((l) => repos.listings.setStatus(l.id, 'archived')),
    ...needs
      .filter((n) => n.status !== 'archived')
      .map((n) => repos.needs.setStatus(n.id, 'archived')),
  ]);

  clearSessionCookie(c);
  return sendOk(c, { deleted: true });
});
