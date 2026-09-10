# PANDAM

PANDAM is a direct **barter marketplace**: users list what they _have_, state
what they _need_, search listings, get rule-based matches, send barter offers,
chat, complete the exchange, and review each other. No money, no credits, no
wallet — a good is traded directly for a good.

> **Status: technical foundation only.** This repository currently contains the
> monorepo, build tooling, an empty Expo app shell, and a Worker health check.
> None of the product features listed above are implemented yet.

## Architecture

```
                    PANDAM
                       |
              +--------+--------+
              |                 |
           FRONTEND          BACKEND
              |                 |
      Expo / React Native   Cloudflare Workers
              |                 |
       iOS / Android / Web     Hono
                                |
                             Services
                                |
                             Drizzle
                                |
                                D1

Images:    App -> Worker -> R2
Realtime:  App -> Worker -> Durable Object -> WebSocket
Jobs:      Worker -> Queue -> Worker (consumer)
```

See [`docs/architecture/overview.md`](docs/architecture/overview.md) and
[`docs/decisions/0001-platform-architecture.md`](docs/decisions/0001-platform-architecture.md).

## Tech stack

| Layer                  | Choice                                                        |
| ---------------------- | ------------------------------------------------------------- |
| App                    | Expo, Expo Router, React Native, React Native Web, TypeScript |
| Styling                | NativeWind (Tailwind)                                         |
| Animation / gesture    | Reanimated, Gesture Handler                                   |
| Images                 | expo-image                                                    |
| Server state           | TanStack Query                                                |
| Client state           | Zustand                                                       |
| Forms / validation     | React Hook Form + Zod                                         |
| API                    | Cloudflare Workers + Hono                                     |
| Database               | Cloudflare D1 + Drizzle ORM                                   |
| Object storage         | Cloudflare R2                                                 |
| Realtime               | Cloudflare Durable Objects + WebSockets                       |
| Background jobs        | Cloudflare Queues                                             |
| Mobile builds          | EAS Build                                                     |
| Monitoring / analytics | Sentry, PostHog                                               |
| Monorepo               | pnpm workspaces + Turborepo                                   |

## Repository layout

```
apps/
  app/          Expo universal app (iOS / Android / Web)
                  app/(auth) app/(app)  route groups + auth guards
                  src/lib/api            fetch client + typed endpoint wrappers
                  src/lib/auth           useSession / login / register / logout
                  src/lib/session        native secure-store token
  worker/       Cloudflare Worker API (Hono)
                  src/routes/api/v1     versioned API (auth, profiles, ...)
                  src/services/auth.ts  register / login / session validation
                  src/middleware/auth.ts context + auth + requireAuth
                  src/domain            pure business rules (matching, lifecycles)
                  src/lib/crypto.ts     PBKDF2 password + session-token hashing
packages/
  ui/           cross-platform UI foundation + design tokens
  types/        shared TypeScript types (derived from the DB schema)
  validation/   shared Zod schemas (auth, profile, listing, ...)
  database/     Drizzle schema + migrations + D1 client + repository layer
  config/       shared tsconfig / eslint / prettier
  utils/        framework-agnostic helpers
docs/
  architecture/ (overview.md, domain.md)   product/   api/   decisions/
scripts/        repo scripts
.github/workflows/  CI
```

## Prerequisites

- Node `^20.19.4 || ^22.13.0 || >=24.3.0` (see `.nvmrc`; required by React Native 0.86 / Expo SDK 57)
- pnpm `>= 9` (`npm i -g pnpm` or `corepack enable`)
- For native builds only: Xcode / Android Studio, plus an Expo account for EAS

## Setup

```bash
pnpm install
cp .env.example .env
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

## Development commands

Run from the repo root:

| Command                             | What it does                                             |
| ----------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                          | Runs every package's `dev` (Expo + Worker) via Turborepo |
| `pnpm dev:app`                      | Expo dev server only (web on port 3000)                  |
| `pnpm dev:worker`                   | `wrangler dev` only (port 8787)                          |
| `pnpm build`                        | Build all packages                                       |
| `pnpm lint`                         | ESLint across the monorepo                               |
| `pnpm typecheck`                    | `tsc --noEmit` across the monorepo                       |
| `pnpm format` / `pnpm format:check` | Prettier write / check                                   |
| `pnpm test`                         | Run all package test suites                              |

### Expo (apps/app)

```bash
pnpm dev:app          # then press w / i / a
```

Web: http://localhost:3000

### Worker (apps/worker)

```bash
pnpm dev:worker
curl http://localhost:8787/health
# { "status": "ok", "service": "pandam-api", ... }
```

### D1 / Drizzle (packages/database)

```bash
pnpm --filter @pandam/database generate       # schema -> SQL migration
pnpm --filter @pandam/database migrate:local  # apply migrations to local D1
pnpm --filter @pandam/database seed:local     # load the category seed
```

Then `pnpm dev:worker` and, for example:

```bash
curl http://localhost:8787/api/v1/categories
curl -s -X POST http://localhost:8787/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"a decent pw 1","displayName":"A"}'
# → { ok:true, data:{ user, profile, token, expiresAt } } + Set-Cookie
```

The **D1 `DB` binding is enabled** in `apps/worker/wrangler.jsonc` with a
placeholder `database_id`, so `wrangler dev` and `--local` migrations work
against a SQLite file under `apps/worker/.wrangler/` — **no cloud resource**.
R2, Durable Objects and Queues bindings remain declared-but-commented; provision
each with `wrangler` and uncomment its block when needed. Nothing here creates
cloud resources or deploys. See
[`docs/architecture/domain.md`](docs/architecture/domain.md) and
[`docs/architecture/auth.md`](docs/architecture/auth.md).

## Environment variables

Documented in [`.env.example`](.env.example). `EXPO_PUBLIC_*` values are embedded
in the client bundle and are not secret (`EXPO_PUBLIC_API_URL` points the app at
the Worker). Worker vars/secrets go in `apps/worker/.dev.vars` locally
(gitignored) and `wrangler secret put` in deployed environments. Auth needs **no
secret locally** — password and token hashing use the runtime's Web Crypto.
`CORS_ORIGINS` (comma-separated) extends the credentialed-CORS allowlist beyond
the built-in `localhost` dev origins. No real secrets live in this repo.
