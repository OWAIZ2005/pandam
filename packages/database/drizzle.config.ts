import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for PANDAM.
 *
 * Dialect is Cloudflare D1 (SQLite). Migrations are plain SQL files under
 * ./migrations and are applied to D1 with `wrangler d1 migrations apply`
 * (see package.json scripts) — NOT with `drizzle-kit migrate`, which cannot
 * reach a D1 database directly.
 *
 * `drizzle-kit studio` and any future push/pull need a real connection; those
 * credentials come from the environment and are only used locally/CI. Nothing
 * here provisions or deploys anything.
 */
export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/schema/index.ts',
  out: './migrations',
  verbose: true,
  strict: true,
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID ?? '',
    token: process.env.CLOUDFLARE_API_TOKEN ?? '',
  },
});
