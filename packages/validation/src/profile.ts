import { boundedString, z } from './common';

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/, 'letters, numbers and underscores only');

/** Coarse, optional location — no coordinates, no street address. */
const locationShape = {
  locationCity: boundedString(1, 120).optional(),
  locationRegion: boundedString(1, 120).optional(),
  locationCountry: boundedString(2, 120).optional(),
};

export const createProfileSchema = z.object({
  displayName: boundedString(1, 80),
  username: usernameSchema.optional(),
  bio: boundedString(1, 500).optional(),
  avatarKey: boundedString(1, 512).optional(),
  ...locationShape,
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = createProfileSchema.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
