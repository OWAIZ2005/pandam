# PANDAM — Authentication & identity

Phase 2 replaced the Phase-1 dev-only `x-pandam-user-id` header with a real,
application-owned session authentication layer. No third-party identity
provider (Auth0 / Clerk / Firebase / Supabase), no OAuth, no JWT — just D1,
Drizzle, Hono and the Web Crypto API.

## 1. Overview

```
              register / login
Client  ───────────────────────────▶  Worker  ──▶  hash password (PBKDF2)
                                                └▶  create session (random token)
        ◀── { user, profile, token, expiresAt } ─┘   store SHA-256(token)
        ◀── Set-Cookie: pandam_session=<token>; HttpOnly; Secure; SameSite=None

              every later request
Client  ──  Cookie: pandam_session  (web)  ──▶  Worker  ──▶  SHA-256(token)
        ──  Authorization: Bearer <token> (native)          look up live session
                                                            attach user to context
```

- **Web** relies entirely on the HttpOnly cookie. Page JavaScript never sees the
  token; nothing is placed in `localStorage`.
- **Native (iOS/Android)** ignores the cookie and sends the token it received in
  the response body as a Bearer header. That token lives in the OS keychain via
  `expo-secure-store`.
- The Worker accepts **either** mechanism (`Authorization: Bearer` wins, then the
  cookie), so one API serves both without branching.

## 2. Database

Two new tables (migration `0002_auth_credentials_sessions`), both `ON DELETE
cascade` from `users`, using the existing id (`crd_…` / `ses_…`) and epoch-ms
timestamp conventions.

### `credentials` — 1:1 with `users`

| column                      | notes                                                                           |
| --------------------------- | ------------------------------------------------------------------------------- |
| `id`                        | `crd_<32hex>`                                                                   |
| `user_id`                   | FK → `users.id`, **UNIQUE**                                                     |
| `password_hash`             | `pbkdf2$sha256$<iters>$<salt_b64url>$<hash_b64url>` — never returned by the API |
| `created_at` / `updated_at` |                                                                                 |

Split from `users` so the identity record can be read/written without touching
the hash, and so passkeys / OAuth can be added later as sibling tables.

### `sessions`

| column         | notes                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| `id`           | `ses_<32hex>`                                                                      |
| `user_id`      | FK → `users.id`, indexed                                                           |
| `token_hash`   | **SHA-256(rawToken) hex, UNIQUE** — the lookup key. The raw token is never stored. |
| `expires_at`   | epoch ms, indexed                                                                  |
| `created_at`   |                                                                                    |
| `last_used_at` | refreshed lazily (only when > 5 min stale) to avoid a write per request            |
| `revoked_at`   | set on logout; `NULL` = active                                                     |
| `user_agent`   | coarse hint for a future "your sessions" screen; not trusted                       |

A session is usable **iff** `revoked_at IS NULL AND expires_at > now`.
Lifetime: **30 days** (`SESSION_TTL_MS`).

## 3. Password storage

`apps/worker/src/lib/crypto.ts`:

- **PBKDF2-HMAC-SHA-256**, `PBKDF2_ITERATIONS = 210_000`, 16-byte random salt,
  32-byte derived key, via `crypto.subtle` (native in Workers, no dependency).
- Verification derives the candidate with the stored salt/iterations and
  compares with a constant-time byte loop.
- The hash string embeds its iteration count, so `needsRehash()` can flag an
  out-of-date work factor and `login` transparently re-hashes on the next
  successful sign-in.
- The plaintext password is never stored, never logged, and never echoed in a
  validation error (Zod strips the value from issue messages).
- Argon2id / scrypt would be stronger but require a WASM dependency; raising
  `PBKDF2_ITERATIONS` or swapping the KDF later is a one-line change plus the
  automatic re-hash. See ADR 0003.

## 4. Sessions & tokens

- Token = 32 random bytes (`crypto.getRandomValues`) → base64url (43 chars).
- Only `SHA-256(token)` is persisted. A database leak therefore yields no usable
  tokens.
- `createAuthService(repos).authenticate(rawToken)` hashes the presented token,
  loads the live session, loads the user, and rejects if the user is not
  `active` — a suspended/deleted user cannot use an existing session.
- `logout` sets `revoked_at`; the very next request with that token is 401.

## 5. Web vs native session handling

|                    | Web                                                     | Native                                       |
| ------------------ | ------------------------------------------------------- | -------------------------------------------- |
| Transport          | `Set-Cookie` / `Cookie`                                 | `Authorization: Bearer`                      |
| Storage            | HttpOnly cookie (browser)                               | `expo-secure-store` (keychain/keystore)      |
| Cookie attrs       | `HttpOnly; Secure; SameSite=None; Path=/; Expires=+30d` | n/a                                          |
| JS access to token | none (by design)                                        | in-memory mirror for the request header only |

`SameSite=None; Secure` is used because the dev/simple-deploy setup has the web
app (`:3000`) and API (`:8787`) on different origins; `localhost` is a secure
context so `Secure` works. A same-site production deployment
(`app.pandam.app` + `api.pandam.app`, shared `Domain=.pandam.app`) should
tighten this to `SameSite=Lax` — tracked as production hardening.

## 6. Auth API (`/api/v1/auth`)

| Method & path    | Auth     | Body                                          | Result                                                                                                                                                                                                                      |
| ---------------- | -------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /register` | —        | `{ email, password, displayName, username? }` | `201` `{ user, profile, token, expiresAt }` + `Set-Cookie`. Creates user + credential + profile + session. Email lower-cased; `409` on duplicate email/username.                                                            |
| `POST /login`    | —        | `{ email, password }`                         | `200` same shape. `401 { code:"unauthorized", message:"Invalid email or password" }` for _any_ failure (wrong password, unknown email) — a constant-cost dummy verify runs for unknown accounts so timing cannot enumerate. |
| `POST /logout`   | optional | —                                             | `200 { loggedOut:true }`, revokes the current session, clears the cookie. No-op `200` when already signed out.                                                                                                              |
| `GET /me`        | required | —                                             | `200 { user, profile }`                                                                                                                                                                                                     |

No `refresh` endpoint: a 30-day opaque session with lazy `last_used_at` is
enough for V1 and adds no rotation complexity. Revisit if session lifetime is
shortened.

Responses are the standard `@pandam/types` envelope and **never** include
`password_hash`, `token_hash` or any KDF material.

## 7. Middleware & request context

`apps/worker/src/middleware/auth.ts`:

- `contextMiddleware(deps)` — builds `RequestContext` (`{ env, db, repos }`) once
  per request and puts it on `c.set('ctx')`. Applied only to the DB-backed
  groups (`auth`, `profiles`, `categories`, `matches`); the surface description
  and the `501` planned groups never touch D1.
- `authMiddleware` — reads the token (Bearer or cookie), resolves it via the
  auth service, and puts `{ user, session } | null` on `c.set('auth')`. Never
  rejects.
- `requireAuth` — rejects with `401 unauthorized` when `c.get('auth')` is null.
- `getAuth(c)` — typed accessor used inside handlers.

**Identity is always taken from `c.get('auth').user.id`.** No handler reads a
user id from the request body or query, so a client cannot impersonate another
user by sending `userId=…`. `/api/v1/matches` was migrated to this model.

## 8. Profile API (`/api/v1/profiles/me`)

All three routes require a session; the target is always the caller.

| Method      | Body                                                       | Notes                                        |
| ----------- | ---------------------------------------------------------- | -------------------------------------------- |
| `GET /me`   | —                                                          | `{ profile }` (or `{ profile: null }`)       |
| `PUT /me`   | `putProfileSchema` (`displayName` required, rest nullable) | full replace — omitted optionals are cleared |
| `PATCH /me` | `patchProfileSchema` (≥ 1 field)                           | partial update                               |

Username changes are checked against other users (`409` if taken); the
`profiles_username_unique` index is the backstop. "Coarse location only"
(city / region / country strings) is preserved — no coordinates.

## 9. Client auth foundation (`apps/app`)

- `src/lib/api/client.ts` — the single `fetch` wrapper: base URL,
  `credentials:'include'`, Bearer header from secure storage, `{ ok:false }` →
  typed `ApiError`. Screens never call `fetch`.
- `src/lib/api/{auth,profile}.ts` — typed endpoint wrappers.
- `src/lib/session/storage.ts` — `sessionToken` (`load/get/set/clear`);
  `expo-secure-store` on native, no-op on web (cookie does the work).
- `src/lib/auth/hooks.ts` — `useSession()` (the single `['auth','me']` query is
  the source of truth: `undefined`+pending → resolving, `null` → signed out,
  object → signed in), `useLogin`, `useRegister`, `useLogout`. TanStack Query
  only; **no Zustand** for auth (it is server state).
- `src/lib/auth/AuthBootstrap.tsx` — loads the native token before the first
  render so the first `me` call is authenticated.

### Routing

```
app/
  _layout.tsx          providers + <Stack>
  index.tsx            gate → <Redirect> to (app) or (auth) once auth is known
  (auth)/_layout.tsx   redirects an authed user to (app)
  (auth)/login.tsx  (auth)/register.tsx
  (app)/_layout.tsx    redirects an unauthed user to (auth)/login  ← guard
  (app)/index.tsx      home (email, edit-profile, sign-out)
  (app)/profile.tsx    edit own profile
```

Each layout renders `<Splash>` while `useSession().isResolving` is true, so the
app never flashes the wrong group during session restoration.

## 10. Security posture

Implemented:

- passwords: PBKDF2-210k, random salt, constant-time compare, never stored/logged/returned
- sessions: random 256-bit token, only its SHA-256 stored, expiry + revocation
- no user enumeration on login (single error + constant-cost dummy verify)
- ownership from the verified session only — no client-supplied user ids
- HttpOnly `Secure` cookie for web; secure-store for native; nothing in `localStorage`
- CORS is an explicit allowlist with `credentials:true` (never `*` — incompatible with cookies)
- Drizzle parameterises every query; no string-built SQL
- all input validated with shared Zod schemas; leak-proof `onError` unchanged
- suspended/deleted users cannot authenticate even with a live session

Intentionally deferred (see §11).

## 11. Deferred production hardening

| Item                                                   | Why deferred                                                                                                                                                       | Where it lands                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Rate limiting** on `/auth/register` + `/auth/login`  | A robust limiter needs Cloudflare's Rate Limiting binding or a Durable Object / KV counter — infrastructure not provisioned this phase. No fake limiter was added. | Infra phase: add the `ratelimit` binding, wrap the two routes.         |
| Argon2id/scrypt password hashing                       | Needs a WASM dependency; PBKDF2-210k is acceptable now and the hash format + `needsRehash` make migration transparent.                                             | Security hardening phase.                                              |
| Email verification / password reset                    | Needs an email provider (Queues + a mail service).                                                                                                                 | Account-management phase (the `users` route group is reserved for it). |
| `SameSite=Lax` + shared parent domain                  | Requires the production same-site deployment topology.                                                                                                             | Deploy phase.                                                          |
| Session rotation / "sign out everywhere" / device list | `revokeAllForUser` exists in the repo; no endpoint yet.                                                                                                            | Account-management phase.                                              |
| CSRF token for cookie auth                             | With `SameSite=None` a CSRF token is warranted for state-changing cookie requests; native (Bearer) is unaffected.                                                  | Deploy phase, alongside the SameSite decision.                         |
| Real D1 integration tests in CI                        | Auth tests use in-memory libsql; wiring a real D1 test binding is separate.                                                                                        | CI phase.                                                              |

## 12. Cloudflare boundaries (unchanged)

Authentication depends only on **D1** (already used locally, no cloud resource
provisioned). No R2, Durable Objects or Queues are used or required by auth.
