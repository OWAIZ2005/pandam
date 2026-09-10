# @pandam/worker

PANDAM API — a Cloudflare Worker built with [Hono](https://hono.dev).

## Run locally

```bash
# once: apply migrations + seed to the local D1 file
pnpm --filter @pandam/database migrate:local
pnpm --filter @pandam/database seed:local

pnpm --filter @pandam/worker dev      # wrangler dev on http://localhost:8787
curl http://localhost:8787/health
```

## Layout

```
src/
  index.ts              Worker entry (ExportedHandler) -> app
  app.ts                createApp({ db? }): Hono app + logger/secure-headers/CORS
  env.ts                Env bindings;  types.ts  AppEnv (Bindings + Variables)
  context.ts            buildContext(c, deps) -> { env, db, repos }
  middleware/auth.ts    contextMiddleware / authMiddleware / requireAuth / getAuth
  services/auth.ts      register / login / logout / authenticate(token)
  lib/crypto.ts         PBKDF2 password hashing + session-token generation/hashing
  lib/cookies.ts        pandam_session HttpOnly cookie helpers
  lib/http.ts           ApiError + { ok, data } / { ok, error } envelopes
  lib/serialize.ts      row -> API shape (drops secrets); toMarketItem
  lib/validate.ts       parseBody / parseQuery (c, zodSchema)
  lib/cursor.ts         opaque base64url keyset cursor (createdAt, id)
  domain/               pure business rules (matching, offer/barter lifecycles, reviews)
  routes/api/v1/        auth · profiles · categories · listings · needs · matches · planned (501)
                        market.ts  createMarketRoute(kind) — one factory for listings + needs
test/
  helpers/db.ts         in-memory libsql + real migrations; createApp({ db })
  auth.test.ts profiles.test.ts market.test.ts lib/crypto.test.ts api.test.ts validation.test.ts domain/*
wrangler.jsonc          D1 binding enabled (placeholder id); R2/DO/Queues commented
.dev.vars.example       local vars template -> copy to .dev.vars
```

## API

`/api/v1` — `GET /api/v1` describes the surface. Implemented: `auth`
(register/login/logout/me), `profiles/me` (GET/PUT/PATCH), `categories` (public
read), `listings` and `needs` (`GET`/`POST` `/`, `GET /mine`, `GET`/`PATCH`
`/:id`, `POST /:id/status` — published-only public discovery with keyset
pagination; ownership always from the session), and `matches` (auth; reciprocal
candidates hydrated as `you ↔ them`, no score). Other resource groups return
`501 not_implemented`. See
[`docs/architecture/marketplace-ui.md`](../../docs/architecture/marketplace-ui.md) §4.

Authentication: server-side sessions, HttpOnly `Secure` cookie for web and
`Authorization: Bearer` for native; identity comes only from the verified
session. Full detail in
[`docs/architecture/auth.md`](../../docs/architecture/auth.md).

## Bindings

`wrangler.jsonc` enables **D1** with a placeholder `database_id` for local dev
(no cloud resource). R2, Durable Objects and Queues stay commented; provision
each with `wrangler` and uncomment its block when needed. See
[`docs/architecture/overview.md`](../../docs/architecture/overview.md).
