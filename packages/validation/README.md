# @pandam/validation

Shared [Zod](https://zod.dev) schemas used by the Expo forms (React Hook Form
with `@hookform/resolvers/zod`) and the Worker request handlers, so client and
server validate identically.

- `common.ts` — primitives: `paginationQuerySchema`, `boundedString`,
  `idSchema(prefix)`, `usernameSchema`, and the domain enums as `z.enum(...)`
  (enum tuples come from `@pandam/database/enums`, so schema and validation
  never drift).
- `auth.ts` — `registerSchema`, `loginSchema`, `emailSchema`, `passwordSchema`
  (min 10, letters + digits; never applied to a login attempt).
- `profile.ts` · `listing.ts` · `need.ts` · `offer.ts` · `message.ts` ·
  `review.ts` · `report.ts` — `create*` / `put*` / `patch*` / action schemas per
  entity, each exporting the inferred input type.

More business schemas are added alongside the features that need them.
