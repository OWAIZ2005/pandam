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
  worker/       Cloudflare Worker API (Hono)
packages/
  ui/           cross-platform UI foundation + design tokens
  types/        shared TypeScript types
  validation/   shared Zod schemas
  database/     Drizzle schema, migrations, D1 client
  config/       shared tsconfig / eslint / prettier
  utils/        framework-agnostic helpers
docs/
  architecture/ product/ api/ decisions/
scripts/        repo scripts
.github/workflows/  CI
```

## Prerequisites

- Node `>= 20.11`
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
pnpm --filter @pandam/database migrate:local  # apply to local D1
```

D1, R2, Durable Objects and Queues bindings are **declared but commented out**
in `apps/worker/wrangler.jsonc`. Provision each resource with `wrangler` and
uncomment its block when you need it — nothing here creates cloud resources or
deploys.

## Environment variables

Documented in [`.env.example`](.env.example). `EXPO_PUBLIC_*` values are embedded
in the client bundle and are not secret. Worker secrets go in
`apps/worker/.dev.vars` locally (gitignored) and `wrangler secret put` in
deployed environments. No real secrets live in this repo.
