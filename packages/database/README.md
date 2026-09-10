# @pandam/database

Drizzle ORM schema, SQL migrations, and the D1 client for PANDAM.

## Layout

```
src/
  schema/index.ts   Drizzle table definitions (barrel). Only `_meta` today.
  client.ts         createDb(d1) -> typed Drizzle instance
  index.ts          public entrypoint
migrations/          SQL migrations applied to D1 via wrangler
  0000_init.sql
  meta/_journal.json Drizzle Kit journal
drizzle.config.ts   Drizzle Kit config (dialect: sqlite, driver: d1-http)
```

## Workflow

1. Edit tables in `src/schema/`.
2. `pnpm --filter @pandam/database generate` — writes a new `migrations/*.sql`.
3. Apply locally: `pnpm --filter @pandam/database migrate:local`
   (runs `wrangler d1 migrations apply pandam-db --local`).
4. Apply to the real D1 database: `... migrate:remote` (requires a configured
   `pandam-db` binding + Cloudflare credentials — not set up in this phase).

`drizzle-kit migrate` is **not** used — it cannot talk to D1 directly. Wrangler
owns migration application.

## Usage from the Worker

```ts
import { createDb } from '@pandam/database';

const db = createDb(env.DB);
```

## Domain schema (not implemented yet)

Planned aggregates: User, Profile, Category, Subcategory, Listing, ListingImage,
Want, Offer, Conversation, Message, Transaction, Review, Notification, Report.
