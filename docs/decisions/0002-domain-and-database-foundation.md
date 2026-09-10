# 0002 — Domain & database foundation

- Status: accepted
- Date: 2026-09-10

## Context

Phase 1 needed a production-quality data model and backend domain layer for the
**direct-barter V1** — enough to build features on, without building the UI,
authentication, AI, credits or payments.

## Decisions

### One Drizzle schema file per aggregate; enums in a leaf module

`packages/database/src/schema/<aggregate>.ts`, re-exported from a barrel. Enum
value tuples live in `src/enums.ts`, which imports nothing, so
`@pandam/validation` and the Expo app can `import` them without pulling Drizzle
(and the D1 driver) into the client bundle. `@pandam/types` derives entity
types from `@pandam/database/schema` (never the client) so it needs no
Cloudflare type dependency.

Rejected: a single `schema.ts` (hard to review, merge-conflict magnet);
duplicating enum unions in each consumer (drift).

### Application-level prefixed string ids

`<prefix>_<32 hex>` via `crypto.randomUUID()` (`newId('user')`). Self-describing
in logs and API payloads, prevents cross-entity id misuse, no DB round-trip, no
dependency. Rejected: integer autoincrement (leaks counts, awkward across a
future shard/replica), bare UUIDs (not self-describing).

### Timestamps as epoch milliseconds everywhere

`integer` in SQLite, `number` in TS, straight through to JSON — no
date-string conversion layer. `created_at` defaults in SQL; the repository
layer stamps `updated_at` on every write.

### Enum columns + CHECK constraints, real foreign keys

`text` enum columns are backed by `CHECK` constraints; FKs use
`cascade`/`restrict`/`set null` per relationship; natural keys use `UNIQUE`
indexes (case-insensitive for `email`/`username`). Integrity that matters —
`reviews` UNIQUE(txn, reviewer), `CHECK(rating 1..5)`, `CHECK(reviewer <>
reviewee)`, distinct offer parties — is enforced by the database, not only by
code.

### Thin repositories in `@pandam/database`; pure domain logic in the Worker

`createRepositories(db)` returns rule-free CRUD/query modules. All business
rules — reciprocal **matching**, the **offer** and **barter-transaction** state
machines, **review** eligibility — are pure, synchronous, dependency-free
functions in `apps/worker/src/domain/`, unit-tested with no database.

Rejected: a separate `packages/domain` (premature for the current size);
business logic inside repositories (couples rules to persistence, hard to
test).

### Deterministic matching, no AI

Compatibility is the structural fact "A HAS x ∧ B NEEDS x ∧ B HAS y ∧ A NEEDS
y", keyed on `(categoryId, type)` — a stable id, never free-form text. No
embeddings, vector search, LLMs or scoring. The `matches` table persists
discovered candidates (for dismissal + offer linkage), it does not store
invented scores. An ML strategy can be added later behind the same function
signature.

### `barter_transactions`, never "payments"

The transaction table has no amount, currency, fee or balance column and is
named for barter. V1 has no wallet, credits, Stripe, crypto or multi-party
chains, and the schema cannot represent one. `Offer` and `BarterTransaction`
are independent aggregates so a future credits system would be additive.

### Auth deferred; identity injected later

No auth provider, no password storage. `apps/worker/src/context.ts` resolves a
user only from a **dev-only** `x-pandam-user-id` header outside production, so
the API structure can be exercised now. A later phase swaps in a real verified
token → `userId`.

### `/api/v1` with honest 501s

Only the read-only `categories` and `matches` groups are implemented. The other
eleven resource groups are mounted and return `501 not_implemented` with the
standard envelope; their planned endpoints are documented in `planned.ts`. No
fake data.

### Local D1 binding enabled

`wrangler.jsonc` enables the `DB` binding with a placeholder `database_id` so
`wrangler dev` and `wrangler d1 migrations apply --local` work against a local
SQLite file. No `wrangler d1 create` was run; nothing remote is provisioned.

## Consequences

- Client and server share one schema, one set of enums and one set of Zod
  rules — they cannot drift.
- The domain layer is fast and trivially testable (44 tests, no DB harness).
- Repository integration tests against a real D1 are a follow-up (would add a
  `@cloudflare/vitest-pool-workers` or `better-sqlite3` dev dependency — not
  worth it this phase).
- Adding a feature = add repository methods + a route group handler + Zod
  schema; the schema, ids, envelopes and lifecycles are already in place.
