-- PANDAM category seed. Idempotent: `INSERT OR IGNORE` + the
-- `categories_slug_unique` index means re-running is a no-op.
-- Ids are generated in SQLite as `cat_<32 hex>` to match the app id format.
-- Keep this file in sync with `src/seed.ts` (CATEGORY_SEED).

INSERT OR IGNORE INTO categories (id, name, slug, status, sort_order, created_at, updated_at) VALUES
  ('cat_' || lower(hex(randomblob(16))), 'Technology',          'technology',           'active', 10,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Design',              'design',               'active', 20,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Web Design',          'web-design',           'active', 21,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Photography',         'photography',          'active', 30,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Video',               'video',                'active', 31,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Writing',             'writing',              'active', 40,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Education',           'education',            'active', 50,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Music',               'music',                'active', 60,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Food',                'food',                 'active', 70,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Home & Garden',       'home-and-garden',      'active', 80,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Electronics',         'electronics',          'active', 90,  unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Clothing',            'clothing',             'active', 100, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Furniture',           'furniture',            'active', 110, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Books',               'books',                'active', 120, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Sports & Outdoors',   'sports-and-outdoors',  'active', 130, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Services',            'services',             'active', 140, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Skills & Tutoring',   'skills-and-tutoring',  'active', 150, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000),
  ('cat_' || lower(hex(randomblob(16))), 'Other',               'other',                'active', 999, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000);
