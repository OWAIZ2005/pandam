/**
 * Row -> API shape mappers. The ONLY place a DB row becomes a response body, so
 * secrets (password hashes, token hashes) can never leak by accident: these
 * functions simply do not copy those fields.
 */
import { type Profile, type PublicProfile, type SafeUser, type User } from '@pandam/types';

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicProfile(profile: Profile | null): PublicProfile | null {
  if (!profile) return null;
  return {
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    avatarKey: profile.avatarKey,
    locationCity: profile.locationCity,
    locationRegion: profile.locationRegion,
    locationCountry: profile.locationCountry,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
