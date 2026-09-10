import { boundedString, usernameSchema, z } from './common';

/** Coarse, optional location — no coordinates, no street address. */
const locationShape = {
  locationCity: boundedString(1, 120).optional(),
  locationRegion: boundedString(1, 120).optional(),
  locationCountry: boundedString(2, 120).optional(),
};

/**
 * Full replacement of the caller's own profile (`PUT /api/v1/profiles/me`).
 * `displayName` is required; everything else is optional and `null` clears it.
 */
export const putProfileSchema = z.object({
  displayName: boundedString(1, 80),
  username: usernameSchema.nullish(),
  bio: boundedString(1, 500).nullish(),
  avatarKey: boundedString(1, 512).nullish(),
  locationCity: boundedString(1, 120).nullish(),
  locationRegion: boundedString(1, 120).nullish(),
  locationCountry: boundedString(2, 120).nullish(),
});
export type PutProfileInput = z.infer<typeof putProfileSchema>;

/** Partial update (`PATCH /api/v1/profiles/me`) — at least one field required. */
export const patchProfileSchema = putProfileSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'at least one field is required' });
export type PatchProfileInput = z.infer<typeof patchProfileSchema>;

// Kept for the shared Zod entrypoint; `createProfileSchema` mirrors `put`.
export const createProfileSchema = z.object({
  displayName: boundedString(1, 80),
  username: usernameSchema.optional(),
  bio: boundedString(1, 500).optional(),
  avatarKey: boundedString(1, 512).optional(),
  ...locationShape,
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
