import { sql } from 'drizzle-orm';
import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { USER_STATUS, type UserStatus } from '../enums';

import { createdAt, idColumn, updatedAt } from './_shared';

export { USER_STATUS, type UserStatus };

/**
 * An authenticated PANDAM user.
 *
 * `email` is the stable authentication identifier for now. This phase does NOT
 * implement an auth provider or store credentials — a later, separate phase
 * wires real authentication and injects the resolved user id into request
 * context. Nothing here assumes a particular provider.
 */
export const users = sqliteTable(
  'users',
  {
    id: idColumn,
    email: text('email').notNull(),
    status: text('status', { enum: USER_STATUS }).notNull().default('active'),
    createdAt,
    updatedAt,
  },
  (t) => [
    // Case-insensitive uniqueness for the auth identifier.
    uniqueIndex('users_email_unique').on(sql`lower(${t.email})`),
    index('users_status_idx').on(t.status),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
