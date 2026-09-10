# 0003 — Authentication & sessions

- Status: accepted
- Date: 2026-09-10

## Context

PANDAM needed real authentication to replace the Phase-1 dev-only
`x-pandam-user-id` header, without pulling in a third-party identity platform or
over-building. It must serve web (Expo Router web) and native (iOS/Android) from
one API, keep passwords safe, and leave room for account management later.

## Decisions

### Application-owned sessions, not a provider or JWT

Opaque server-side sessions in D1, keyed by `SHA-256(token)`. No Auth0 / Clerk /
Firebase / Supabase (excluded by the brief and by the "one vendor" principle
from ADR 0001). No JWT: opaque tokens are revocable instantly (logout ⇒
`revoked_at`), carry no client-readable claims, and need no signing-key
management. A 30-day lifetime with lazy `last_used_at` means no refresh-token
machinery.

### PBKDF2-HMAC-SHA-256 via Web Crypto, work factor in the hash

`crypto.subtle` is native to Workers and Node — zero dependency, identical in
tests. 210 000 iterations, 16-byte salt, constant-time compare. The hash string
is `pbkdf2$sha256$<iters>$<salt>$<hash>`, so raising the work factor (or moving
to Argon2id/scrypt behind a WASM dep) later only needs a new branch in
`verifyPassword` + the existing `needsRehash` re-hash-on-login path. Argon2id
was rejected _for now_ only to avoid the WASM dependency.

### Split `credentials` from `users`

A 1:1 `credentials` table holds the hash. The identity record (`users`) can then
be read/joined everywhere without exposing the hash, and passkeys / OAuth become
sibling tables instead of nullable columns on `users`.

### Store only `SHA-256(token)`

The raw 256-bit token is shown once (login/register body + cookie). The database
stores only its hash, so a dump of `sessions` cannot be replayed.

### Cookie for web, Bearer for native, API accepts both

Web: `HttpOnly; Secure; SameSite=None` cookie — nothing in `localStorage`, page
JS cannot read the token. Native: the token from the response body, kept in
`expo-secure-store`, sent as `Authorization: Bearer`. The Worker checks Bearer
first, then the cookie. `SameSite=None` (not `Lax`) because dev and simple
deploys put web and API on different origins; `localhost` counts as secure so
`Secure` works. A same-site production topology can move to `Lax` — deferred.

### No user enumeration on login

`login` returns exactly one error (`401 "Invalid email or password"`) for a
wrong password _and_ an unknown email, and runs a constant-cost dummy PBKDF2
verify when the account does not exist so response timing does not leak
existence. `register` still returns `409` for a duplicate email/username — that
disclosure is unavoidable and expected.

### Identity only from the verified session

`c.get('auth').user.id`. No route reads a user id from the request. `/matches`
was migrated off the dev header to this model.

### Auth state on the client = one TanStack Query entry

`['auth','me']`: `undefined`+pending → resolving (show splash), `null` → signed
out, object → signed in. Mutations update that entry and the native token store.
No Zustand for auth — it is server state. Route groups `(auth)` / `(app)` each
redirect based on that entry and render a splash while it resolves, so no
wrong-route flash.

### Tests: in-memory libsql, not better-sqlite3

Auth correctness depends on real SQL constraints (unique email/username, FK
cascade, expiry), so the worker tests run against a real SQLite engine with the
project's actual migrations. `@libsql/client` was chosen over `better-sqlite3`
because it ships prebuilt binaries (no node-gyp) — CI-friendly. `createApp({ db
})` injects it; production still builds the client from `env.DB`.

## Consequences

- One dev dependency added to `@pandam/worker` (`@libsql/client`) plus
  `drizzle-orm` as a direct devDep for the libsql driver/migrator.
- `packages/database` `Database` type was widened from `DrizzleD1Database` to the
  driver-agnostic `BaseSQLiteDatabase<'sync'|'async', …>` so repositories run
  unchanged on both drivers (Phase 1 already anticipated this).
- Rate limiting is **not** implemented (needs unprovisioned infra); documented
  as the first item for the infra phase. No fake limiter was added.
- Password/reset, email verification, session rotation and "sign out
  everywhere" are deferred to an account-management phase; `revokeAllForUser`
  already exists in the sessions repo.
