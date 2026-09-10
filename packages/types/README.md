# @pandam/types

Shared TypeScript types consumed by `apps/app` and `apps/worker`.

Domain entity types (`User`, `Listing`, `Offer`, …) and enum unions are
**derived** from the Drizzle schema via `@pandam/database/schema` (the schema
barrel only — never the D1 client, so this package needs no Cloudflare type
deps). Do not hand-write them.

Also here: branded id types (`UserId`, `ListingId`, …), the API envelopes
(`ApiOk` / `ApiErr` / `ApiResponse`), `Paginated<T>`, `Platform`, `Environment`.

Timestamp convention: every `*At` field is epoch **milliseconds** (`number`),
DB → domain → JSON, with no conversion layer.
