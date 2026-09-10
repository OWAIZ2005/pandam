/**
 * Worker runtime bindings. `PANDAM_ENV` and `DB` are wired up; the rest are
 * optional so route code can target the final shape while their wrangler.jsonc
 * bindings are still commented out.
 *
 * The Hono generic every router uses is `AppEnv` (see `./types.ts`), which adds
 * the middleware-set `Variables` (`ctx`, `auth`) on top of these `Bindings`.
 */
export interface Env {
  /** Plain var from wrangler.jsonc. */
  PANDAM_ENV: 'development' | 'preview' | 'production';

  /**
   * Comma-separated list of browser origins allowed to send credentialed
   * requests (cookies). Defaults to the local Expo web/dev-tools origins.
   */
  CORS_ORIGINS?: string;

  /** Secret (apps/worker/.dev.vars locally). */
  SENTRY_DSN?: string;
  POSTHOG_KEY?: string;
  POSTHOG_HOST?: string;

  /** D1 — enabled once the d1_databases binding is uncommented. */
  DB?: D1Database;
  /** R2 — enabled once the r2_buckets binding is uncommented. */
  MEDIA?: R2Bucket;
  /** Durable Object namespace — enabled once the binding is uncommented. */
  CONVERSATION?: DurableObjectNamespace;
  /** Queue producer — enabled once the binding is uncommented. */
  JOBS?: Queue<unknown>;
}
