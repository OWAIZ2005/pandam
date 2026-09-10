/**
 * `/api/v1/profiles/me` — the caller's own profile. Every route requires a
 * verified session; the user id comes from that session, never from the body,
 * so a user can only ever read or modify their own profile.
 *
 *   GET   /me   read
 *   PUT   /me   full replace (displayName required; omitted optionals cleared)
 *   PATCH /me   partial update (>= 1 field)
 */
import { patchProfileSchema, putProfileSchema } from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { ApiError, sendOk } from '../../../lib/http';
import { toPublicProfile } from '../../../lib/serialize';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

export const profilesRoute = new Hono<AppEnv>();

profilesRoute.use('*', authMiddleware, requireAuth);

profilesRoute.get('/me', async (c) => {
  const { user } = getAuth(c);
  const profile = await c.get('ctx').repos.profiles.findByUserId(user.id);
  return sendOk(c, { profile: toPublicProfile(profile) });
});

/** Reject a username already held by a different user. */
async function assertUsernameFree(
  c: Context<AppEnv>,
  username: string | null | undefined,
  userId: string,
): Promise<void> {
  if (!username) return;
  const existing = await c.get('ctx').repos.profiles.findByUsername(username);
  if (existing && existing.userId !== userId) {
    throw new ApiError('conflict', 'That username is taken.', { username: ['already taken'] });
  }
}

profilesRoute.put('/me', async (c) => {
  const { user } = getAuth(c);
  const input = await parseBody(c, putProfileSchema);
  await assertUsernameFree(c, input.username, user.id);

  const updated = await c.get('ctx').repos.profiles.update(user.id, {
    displayName: input.displayName,
    username: input.username ?? null,
    bio: input.bio ?? null,
    avatarKey: input.avatarKey ?? null,
    locationCity: input.locationCity ?? null,
    locationRegion: input.locationRegion ?? null,
    locationCountry: input.locationCountry ?? null,
  });
  if (!updated) throw new ApiError('not_found', 'Profile not found.');
  return sendOk(c, { profile: toPublicProfile(updated) });
});

profilesRoute.patch('/me', async (c) => {
  const { user } = getAuth(c);
  const input = await parseBody(c, patchProfileSchema);
  await assertUsernameFree(c, input.username, user.id);

  const updated = await c.get('ctx').repos.profiles.update(user.id, input);
  if (!updated) throw new ApiError('not_found', 'Profile not found.');
  return sendOk(c, { profile: toPublicProfile(updated) });
});
