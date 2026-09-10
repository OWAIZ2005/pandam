/**
 * Deterministic seed data. Not applied automatically — a later phase runs this
 * against local/remote D1. Categories are the normalised matching keys, so they
 * must be stable: never rename a `slug`, only add rows or flip `status`.
 */
export interface CategorySeed {
  name: string;
  slug: string;
  sortOrder: number;
}

export const CATEGORY_SEED: readonly CategorySeed[] = [
  { name: 'Technology', slug: 'technology', sortOrder: 10 },
  { name: 'Design', slug: 'design', sortOrder: 20 },
  { name: 'Web Design', slug: 'web-design', sortOrder: 21 },
  { name: 'Photography', slug: 'photography', sortOrder: 30 },
  { name: 'Video', slug: 'video', sortOrder: 31 },
  { name: 'Writing', slug: 'writing', sortOrder: 40 },
  { name: 'Education', slug: 'education', sortOrder: 50 },
  { name: 'Music', slug: 'music', sortOrder: 60 },
  { name: 'Food', slug: 'food', sortOrder: 70 },
  { name: 'Home & Garden', slug: 'home-and-garden', sortOrder: 80 },
  { name: 'Electronics', slug: 'electronics', sortOrder: 90 },
  { name: 'Clothing', slug: 'clothing', sortOrder: 100 },
  { name: 'Furniture', slug: 'furniture', sortOrder: 110 },
  { name: 'Books', slug: 'books', sortOrder: 120 },
  { name: 'Sports & Outdoors', slug: 'sports-and-outdoors', sortOrder: 130 },
  { name: 'Services', slug: 'services', sortOrder: 140 },
  { name: 'Skills & Tutoring', slug: 'skills-and-tutoring', sortOrder: 150 },
  { name: 'Other', slug: 'other', sortOrder: 999 },
] as const;

/** Normalise arbitrary user text to a category slug candidate. */
export function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
