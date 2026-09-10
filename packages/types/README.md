# @pandam/types

Shared TypeScript types consumed by `apps/app` and `apps/worker`.

Deliberately minimal. Domain entity types will be derived from the Drizzle
schema (`@pandam/database`) and re-exported here so there is one source of
truth — do not hand-write `User`, `Listing`, etc.
