# PANDAM — Architecture overview

This describes the target architecture. Built so far: the Expo app shell, the
Worker + `/api/v1` structure, and the full **domain & database foundation**
(schema, migrations, repositories, matching, lifecycles) — see
[`domain.md`](domain.md). R2, Durable Objects and Queues remain scaffolding.

## 1. Universal Expo frontend (`apps/app`)

One React Native codebase compiled to three targets:

- **iOS / Android** via Expo (managed / Continuous Native Generation).
- **Web** via React Native Web + Expo Router's static export.

Routing is file-based (`app/` directory, Expo Router). Styling is Tailwind via
NativeWind. Animations use Reanimated; gestures use Gesture Handler. Images use
`expo-image`.

Client responsibilities and the tools that own them:

| Concern                          | Owner                      |
| -------------------------------- | -------------------------- |
| Server data (fetch/cache/mutate) | TanStack Query             |
| Client / UI state                | Zustand                    |
| Form state                       | React Hook Form            |
| Validation (shared with server)  | Zod (`@pandam/validation`) |

The app talks to exactly one backend: the Worker API. It never touches D1, R2,
Durable Objects or Queues directly.

## 2. Cloudflare Worker API (`apps/worker`)

A single Worker is the entire backend surface. It:

- terminates all HTTP from the app,
- authenticates requests,
- runs business/services logic,
- reads/writes D1 through Drizzle,
- signs/streams R2 objects,
- routes realtime connections to Durable Objects,
- enqueues background work onto Queues.

## 3. Hono

The HTTP framework inside the Worker. `createApp()` builds a `Hono` instance
with global middleware (logger, secure headers, CORS) and mounts route modules
(`routes/health.ts` today). It is exported as a plain app so tests call
`app.request()` with no network.

## 4. Cloudflare D1

Serverless SQLite, bound to the Worker as `env.DB`. Single primary database
(`pandam-db`). Accessed only through Drizzle, only via the repository layer.
Migrations are SQL files (`packages/database/migrations/`) applied with
`wrangler d1 migrations apply pandam-db --local | --remote`. No cloud database
is provisioned — local development uses a SQLite file under `.wrangler/`.

## 5. Drizzle ORM (`packages/database`)

Type-safe schema + query builder + repository layer.

- `src/schema/*` — one file per aggregate (16 domain tables + `_meta`), the
  single source of truth for the data model. `src/enums.ts` holds the enum
  value tuples with zero Drizzle imports so `@pandam/validation` and the app
  can reuse them.
- `src/id.ts` — `newId('user') → "usr_<32hex>"` application-level ids.
- `src/client.ts` — `createDb(env.DB)` returns the typed Drizzle client.
- `src/repositories/*` — thin, rule-free data access. `createRepositories(db)`
  hands back one object with every entity repository. Business rules live in the
  Worker's `domain/` layer, never here.
- `src/seed.ts` + `seed/categories.sql` — deterministic category seed.

Entity types are derived from the schema (`$inferSelect`) and re-exported via
`@pandam/types` (from `@pandam/database/schema` — the schema barrel only, never
the client) so the app and Worker share one definition and need no Cloudflare
type deps. See [`domain.md`](domain.md).

## 6. Cloudflare R2

Object storage for user-uploaded media (listing images), bound as `env.MEDIA`.

```
App  --(request upload URL / multipart)-->  Worker  --(put/get)-->  R2
App  <--(short-lived signed GET URL)------  Worker
```

The app never holds R2 credentials; the Worker mediates every transfer.

## 7. Cloudflare Durable Objects

One `ConversationRoom` Durable Object instance per conversation holds the
authoritative realtime state (connected sockets, presence, fan-out). Bound as
`env.CONVERSATION`.

## 8. WebSockets

```
App  --(WS upgrade: /realtime/conversation/:id)-->  Worker
Worker  --(routes by id to)-->  ConversationRoom Durable Object
ConversationRoom  <--(persistent WS)-->  every participant's App
```

The Worker authenticates the upgrade, then hands the socket to the Durable
Object, which owns the connection lifecycle and message broadcast. Durable
message history is persisted to D1.

## 9. Cloudflare Queues

Asynchronous / deferred work: push notifications, image post-processing,
digest emails, match recomputation. The Worker is both producer (`env.JOBS`)
and consumer (a `queue()` handler). Failed messages retry with backoff and land
in a dead-letter queue.

```
Worker (request handler)  --enqueue-->  Queue  --batch-->  Worker (queue handler)
```

## How it communicates — request lifecycles

**Standard API call**
`App (TanStack Query) → HTTPS → Worker (Hono) → middleware/auth → service → Drizzle → D1 → JSON envelope → App`

**Image upload**
`App → Worker (validate, authorize) → R2.put → Worker enqueues post-process job → Queue → Worker consumer → R2/D1`

**Realtime message**
`App → WS upgrade → Worker (auth) → ConversationRoom DO → broadcast to peers; DO → D1 (persist); DO → Queue (notify offline users)`

## Extensibility (deliberately kept open, not built)

- **AI matching** — matching is a service module behind an interface; a
  rule-based implementation now, an ML-backed one later, no schema change forced.
- **PANDAM credits / multi-party barter** — `Offer` and `Transaction` are
  modelled as their own aggregates so additional offer types or N-party
  transaction graphs can be added without reworking listings or chat.

None of these are implemented in this phase.
