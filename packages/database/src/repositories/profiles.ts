import { eq, sql } from 'drizzle-orm';

import { newId } from '../id';
import { type NewProfileRow, type ProfileRow, profiles } from '../schema/profiles';

import { type Database, firstOrNull, one, touch } from './helpers';

export type CreateProfileInput = Omit<NewProfileRow, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProfileInput = Partial<Omit<CreateProfileInput, 'userId'>>;

export function profilesRepository(db: Database) {
  return {
    async create(input: CreateProfileInput): Promise<ProfileRow> {
      const rows = await db
        .insert(profiles)
        .values({ ...input, id: newId('profile') })
        .returning();
      return one(rows, 'profiles.create');
    },

    async findByUserId(userId: string): Promise<ProfileRow | null> {
      const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      return firstOrNull(rows);
    },

    /** Case-insensitive username lookup (the unique index is the real guard). */
    async findByUsername(username: string): Promise<ProfileRow | null> {
      const rows = await db
        .select()
        .from(profiles)
        .where(sql`lower(${profiles.username}) = lower(${username})`)
        .limit(1);
      return firstOrNull(rows);
    },

    async update(userId: string, patch: UpdateProfileInput): Promise<ProfileRow | null> {
      const rows = await db
        .update(profiles)
        .set({ ...patch, ...touch() })
        .where(eq(profiles.userId, userId))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type ProfilesRepository = ReturnType<typeof profilesRepository>;
