# 0001 — Platform architecture

- Status: accepted
- Date: 2026-09-10

## Context

PANDAM must ship to iOS, Android and Web with a small team, be cheap to run at
low volume, scale without re-platforming, and stay a barter-only product while
leaving room for AI matching, credits and multi-party barter later.

## Decision

### Expo + React Native + React Native Web

One codebase, three platforms. Expo gives us OTA updates, EAS Build, a managed
native layer (CNG) and a large, current library ecosystem. React Native Web
renders the same components on the web target, so product screens are written
once. Expo Router gives file-based routing that works identically across
platforms and produces a static web export.

Alternatives rejected: separate native apps + a separate web SPA (3× the
surface); Flutter (team is TypeScript-first, and we want to share validation
and types with the backend).

### Cloudflare Workers + Hono

The backend is a single Worker. Rationale: global edge execution, no servers to
run, generous free tier, per-request billing, and first-party primitives for
everything we need (D1, R2, Durable Objects, Queues) so there is no second
vendor to integrate or secure. Hono is a tiny, fast, well-typed router designed
for Workers, testable without a network.

Alternatives rejected: Node/Express on a VM or container (ops burden, cold
regions); a BaaS like Supabase/Firebase (less control over the data model and
matching logic, harder to keep barter-only rules server-authoritative).

### Cloudflare D1 + Drizzle ORM

D1 is SQLite at the edge, bound directly to the Worker — no connection pooling,
no network hop to a separate DB tier. SQLite is more than sufficient for a
marketplace's read-heavy workload at our scale. Drizzle gives compile-time-safe
queries and a schema that doubles as the source of truth for shared types,
with plain-SQL migrations we can review.

Alternatives rejected: Postgres (Neon/RDS) — extra latency and cost we don't
need yet; Prisma — heavier runtime, historically awkward on Workers.

### Cloudflare R2

S3-compatible object storage with zero egress fees, bound to the Worker. The
Worker mediates every upload/download so the client never holds storage
credentials.

### Cloudflare Durable Objects + WebSockets

Realtime chat and presence need a single authoritative coordination point per
conversation. A Durable Object is exactly that: one addressable instance,
strongly consistent, holding the sockets and fanning out messages, with
hibernation to keep idle rooms free.

Alternatives rejected: a third-party realtime service (Pusher/Ably) — another
vendor and bill; polling — poor UX for chat.

### Cloudflare Queues

Background and deferred work (notifications, image processing, match
recomputation) runs off the request path with retries and a dead-letter queue,
using the same platform and billing as everything else.

## Consequences

- One vendor for compute, data, storage, realtime and jobs — simple to reason
  about and secure; a future multi-region or multi-cloud need would be a project.
- SQLite/D1 constrains some access patterns (write throughput, very large
  analytical queries); acceptable now, revisit if it bites.
- Matching, offers and transactions are modelled as independent service modules
  / aggregates so AI matching, credits and multi-party barter can be added
  later without reworking the core. They are **not** built in this phase.
- Shared `types` and `validation` packages mean the app and Worker cannot drift
  on data shape or input rules.
