/**
 * Shared helpers for the repository layer. Repositories are thin, typed
 * data-access modules over Drizzle — they contain NO business rules (those live
 * in the Worker's domain layer). They exist so route/service code never builds
 * raw queries and so column conventions (ids, timestamps) are applied in one
 * place.
 */
import { type Database } from '../client';

export type { Database };

/** Epoch-ms "now". Repositories stamp `updatedAt` on every write. */
export const now = (): number => Date.now();

/** Fields to set on every update so `updatedAt` is never forgotten. */
export const touch = (): { updatedAt: number } => ({ updatedAt: now() });

/** Return the single row of a `.returning()` result, or throw if absent. */
export function one<T>(rows: T[], entity: string): T {
  const row = rows[0];
  if (!row) throw new Error(`${entity}: expected a row to be returned`);
  return row;
}

/** Return the first row of a select, or `null`. */
export function firstOrNull<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}
