# @pandam/database

Drizzle ORM schema, SQL migrations, the D1 client, and the repository layer for
PANDAM. See [`docs/architecture/domain.md`](../../docs/architecture/domain.md)
for the entity/relationship reference.

## Layout

```
src/
  enums.ts            Enum value tuples — imports NOTHING (safe for the client bundle)
  id.ts               newId('user') -> "usr_<32hex>", isId()
  schema/
    _shared.ts        column helpers (timestamps, id column)
    <aggregate>.ts    one file per table (users, credentials, sessions, profiles,
                      categories, listings, listing-images, needs, matches,
                      offers, conversations, messages, barter-transactions,
                      reviews, notifications, reports, disputes) + meta
    index.ts          barrel — the single source of truth for the data model
  client.ts           createDb(d1) -> Drizzle instance. `Database` is the
                      driver-agnostic BaseSQLiteDatabase type, so repositories
                      also run on an in-memory libsql engine in tests.
  repositories/
    <entity>.ts       thin, rule-free data access (Create*/Update* input types)
    market.ts         read model for discovery — item + owner profile + category
                      JOINs; returns only the PUBLIC owner slice. Keeps the
                      plain listings/needs repos simple CRUD.
    index.ts          createRepositories(db) -> { users, listings, market, ... }
  seed.ts             CATEGORY_SEED, toSlug()
  index.ts            public entrypoint
migrations/           SQL migrations applied to D1 via wrangler
  0000_init.sql, 0001_domain_foundation.sql, meta/*
seed/categories.sql  idempotent category seed for `wrangler d1 execute`
drizzle.config.ts    Drizzle Kit config (dialect: sqlite, driver: d1-http)
```

## Entrypoints

| Import                    | Contents                                                       |
| ------------------------- | -------------------------------------------------------------- |
| `@pandam/database`        | `createDb`, `createRepositories`, schema, ids, seed            |
| `@pandam/database/schema` | schema tables + row types only (no D1 client)                  |
| `@pandam/database/enums`  | enum tuples + unions, zero deps — used by `@pandam/validation` |
| `@pandam/database/seed`   | `CATEGORY_SEED`, `toSlug`                                      |

## Conventions

- **Ids:** application-generated `<prefix>_<32 hex>` (`src/id.ts`).
- **Timestamps:** epoch **ms** `integer`; `created_at` defaults in SQL,
  `updated_at` is stamped by repositories on every write.
- **Enums:** `text` columns backed by `CHECK` constraints.
- **FKs:** `cascade` / `restrict` / `set null` per relationship.
- Repositories contain **no business rules** — those live in
  `apps/worker/src/domain`.

## Workflow

1. Edit tables in `src/schema/`.
2. `pnpm --filter @pandam/database generate` — writes a new `migrations/*.sql`.
3. `pnpm --filter @pandam/database migrate:local` — applies to a local SQLite
   file under `apps/worker/.wrangler/` (needs the `DB` binding, which is
   enabled with a placeholder id in `apps/worker/wrangler.jsonc`).
4. `pnpm --filter @pandam/database seed:local` — loads the category seed.
5. `... migrate:remote` — real D1, a later phase (run `wrangler d1 create
pandam-db` and paste the id first).

`drizzle-kit migrate` is **not** used — it cannot talk to D1. Wrangler owns
migration application. Generated SQL is never hand-edited.

## Usage from the Worker

```ts
import { createDb, createRepositories } from '@pandam/database';

const db = createDb(env.DB);
const repos = createRepositories(db);
const categories = await repos.categories.listActive();
```
