# @pandam/worker

PANDAM API — a Cloudflare Worker built with [Hono](https://hono.dev).

## Run locally

```bash
pnpm --filter @pandam/worker dev      # wrangler dev on http://localhost:8787
curl http://localhost:8787/health
```

Expected:

```json
{ "status": "ok", "service": "pandam-api", "env": "development", "time": "..." }
```

## Layout

```
src/
  index.ts         Worker entry (ExportedHandler) -> delegates to app
  app.ts           createApp(): Hono app + global middleware
  env.ts           Env bindings interface + Hono generics
  routes/health.ts GET /health
test/health.test.ts  vitest, uses app.request()
wrangler.jsonc     bindings config (D1/R2/DO/Queues commented out until provisioned)
.dev.vars.example  local secrets template -> copy to .dev.vars
```

## Bindings

`wrangler.jsonc` documents D1, R2, Durable Objects and Queues. They are
commented out so `wrangler dev` runs with no external resources. To enable one,
provision it (`wrangler d1 create pandam-db`, etc.), paste the id, and
uncomment the block. See `docs/architecture/overview.md`.

No business endpoints exist yet — infrastructure only.
