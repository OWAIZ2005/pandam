/**
 * Worker runtime bindings.
 *
 * Only `PANDAM_ENV` is wired up today. The rest are declared as optional so
 * route code can be written against the final shape, but nothing crashes while
 * the bindings are still commented out in wrangler.jsonc.
 */
export interface Env {
  /** Plain var from wrangler.jsonc. */
  PANDAM_ENV: 'development' | 'preview' | 'production';

  /** Secret (apps/worker/.dev.vars locally). */
  JWT_SECRET?: string;
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

/** Hono generics for this app: `new Hono<AppBindings>()`. */
export interface AppBindings {
  Bindings: Env;
}
