import { eq, sql } from 'drizzle-orm';

import { newId } from '../id';
import { type UserRow, type UserStatus, users } from '../schema/users';

import { type Database, firstOrNull, one, touch } from './helpers';

export interface CreateUserInput {
  email: string;
}

export function usersRepository(db: Database) {
  return {
    async create({ email }: CreateUserInput): Promise<UserRow> {
      const rows = await db
        .insert(users)
        .values({ id: newId('user'), email: email.trim() })
        .returning();
      return one(rows, 'users.create');
    },

    async findById(id: string): Promise<UserRow | null> {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return firstOrNull(rows);
    },

    async findByEmail(email: string): Promise<UserRow | null> {
      const rows = await db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = lower(${email.trim()})`)
        .limit(1);
      return firstOrNull(rows);
    },

    async setStatus(id: string, status: UserStatus): Promise<UserRow | null> {
      const rows = await db
        .update(users)
        .set({ status, ...touch() })
        .where(eq(users.id, id))
        .returning();
      return firstOrNull(rows);
    },
  };
}

export type UsersRepository = ReturnType<typeof usersRepository>;
