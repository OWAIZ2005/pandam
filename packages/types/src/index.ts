/**
 * @pandam/types — shared types used by both the Expo app and the Worker.
 *
 * Keep this package small. Domain entity types (User, Listing, Offer, ...) will
 * be *derived* from the Drizzle schema in @pandam/database and re-exported here
 * once those tables exist, so there is a single source of truth. For now this
 * only holds primitives that are genuinely cross-cutting.
 */

/** ISO-8601 timestamp string, e.g. "2026-01-01T00:00:00.000Z". */
export type IsoDateString = string;

/** Opaque branded id helper — prevents mixing a UserId with a ListingId. */
export type Id<TBrand extends string> = string & { readonly __brand: TBrand };

/** Standard success envelope returned by the PANDAM API. */
export interface ApiOk<TData> {
  ok: true;
  data: TData;
}

/** Standard error envelope returned by the PANDAM API. */
export interface ApiErr {
  ok: false;
  error: {
    code: string;
    message: string;
    /** Optional field-level details, e.g. from Zod validation. */
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<TData> = ApiOk<TData> | ApiErr;

/** Cursor-paginated list result. */
export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export type Platform = 'ios' | 'android' | 'web';

export type Environment = 'development' | 'preview' | 'production';
