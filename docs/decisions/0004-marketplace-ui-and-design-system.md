# 0004 — Marketplace UI & design system

- Status: accepted
- Date: 2026-09-10

## Context

Phases 1–2 delivered the domain model, the deterministic matcher, the offer /
barter lifecycles, and real session auth — but no product surface. Phase 3 adds
the marketplace UI: a cross-platform design system, the navigation shell, and
the "I HAVE" / "I NEED" / discovery / matches / profile screens, wired to real
API data. It must serve web and native from one codebase, never fake marketplace
data, keep every existing test green, and not drift into building offers, chat,
transactions or production image upload.

## Decisions

### `@pandam/ui` primitives are pure React Native + tokens, no NativeWind

The design-system primitives (`Text`, `Button`, `Screen`, `Card`, `Input`, …)
render from imperative token styles only. NativeWind stays in the **app**, for
one-off screen layout via `className`. Reasons: predictable identical rendering
on iOS / Android / web without a Babel/Metro transform in the library build;
the package has no styling peer beyond `react-native`; and the Tailwind theme in
`apps/app/tailwind.config.js` is generated from the same token names, so utility
classes and `StyleSheet` values cannot diverge. Tokens carry **semantic** names
(`accent`, `need`, `surface`, `textMuted`), not raw hex — screens never see a
colour literal.

### Light theme only, but structured for a second palette

`colors` is one flat object today. A dark theme is a second object plus a
provider switch — no component change — so shipping light-only now costs nothing
later. Deferred because it is not on the Phase 3 brief.

### Product colour cue baked into tokens

"I HAVE" is green (`accent*`), "I NEED" is coral (`need*`). These are token
groups, not per-component constants, so the cue is consistent across `Badge`,
`Chip`, `QuickAction`, `MatchCard` and the Create screen without coordination.

### Domain cards live in the app, not the package

`ItemCard`, `MatchCard`, `CategoryFilter`, `AppHeader` depend on `@pandam/types`
shapes and on the router. Keeping them in `apps/app/src/components/` leaves
`@pandam/ui` free of API and navigation dependencies — it stays a true design
system, reusable by a future second app or a Storybook.

### One route tree with nested groups; tabs are a group inside `(app)`

`app/(app)/(tabs)/` owns the bottom bar; non-tab screens (`new-listing`,
`listing/[id]`, `match/[key]`, `edit-profile`, …) are stack siblings under
`(app)`. The `(app)` layout is the single auth guard (Splash while auth
resolves, redirect to `(auth)/login` when signed out); `(auth)` bounces a
signed-in user out. Web gets the **same** routes — responsiveness is one
`Screen` component that centres content at `maxWidth: 760`, not a separate
layout. This avoids "mobile UI, but wider".

### Listings and needs share one implementation, server and client

They are structurally identical (`ItemType`, title, description, status, owner,
category — no price). The Worker exposes them through a single
`createMarketRoute(kind)` Hono factory; the client through `marketApi` /
`useMarket` parameterised by `kind`. One code path, one set of tests
(parameterised), no copy-paste to drift.

### A dedicated read-model repository for discovery

`repositories/market.ts` holds every cross-entity JOIN (item + owner profile +
category). The plain `listings` / `needs` repos stay rule-free CRUD. The read
model returns only the **public** owner slice (`id`, `displayName`,
`username`) — a discovery response can never leak an email or credential.

### Keyset pagination with an opaque cursor

Discovery pages on `(createdAt desc, id desc)` with a base64url `cursor` that
encodes the last row's `(createdAt, id)`. No `OFFSET` (which re-scans and skips
rows as data changes), no total count (unbounded, and not needed for infinite
scroll). The cursor is opaque so the ordering can change later without a client
contract change. `limit` is capped at 50.

### Ownership from the session, always; drafts are private

`POST` sets `ownerId` to `c.get('auth').user.id` and ignores any owner id in the
body. `PATCH` / status changes load the row, `404` if missing, `403` unless
`ownerId` matches the session. `GET /:id` returns `404` (not `403`) for a
non-published item unless the caller is the owner — a paused/draft item does not
disclose its existence. Discovery (`GET /`) is published-only regardless of who
asks. This extends the Phase 2 rule "identity only from the verified session" to
the marketplace.

### Matcher unchanged; hydration in the route

`domain/matching.ts` stays a pure function over `{ id, ownerId, categoryId,
type }`. `GET /matches` runs it, filters to the current user, then batch-loads
the four item ids per match into a `you ↔ them` `ReciprocalMatchView` with
titles / categories / owner names. The UI (`MatchCard`) shows the reciprocity as
a 2×2 grid — "YOU HAVE / THEY NEED / YOU NEED / THEY HAVE" — with **no numeric
score and no "AI" language**, because compatibility is a structural fact
([`domain.md` §4](../architecture/domain.md)).

### Images: local preview only, clearly labelled

`expo-image-picker` produces local URIs shown as `expo-image` thumbnails under
"Local preview only — photo upload arrives with cloud storage, so these aren't
saved yet". They are **not** submitted and **no** permanent URL is fabricated.
R2 is not provisioned; pretending otherwise would put dead links in the data.

### Unsupported actions are disabled with an honest note, not hidden or faked

"Offer a trade" / "Make an offer" render as disabled controls with "Sending an
offer and arranging the barter arrives in the next phase." Users see where the
flow goes without the app lying about what works today.

### Server-state only via TanStack Query; Zustand untouched

All marketplace data is TanStack Query. `useDiscover` is an infinite query keyed
by the filter object. Mutations invalidate both the item caches **and**
`qk.matches` (an item edit can make or break a reciprocal match) and prime
`qk.market.detail`. Zustand remains UI-only (theme / onboarding), consistent
with ADR 0003.

## Consequences

- Two app dependencies added: `@expo/vector-icons` (tab + UI icons) and
  `expo-image-picker` (local photo preview). Lockfile updated.
- `apps/app/app/(app)/` was restructured into `(tabs)` + stack siblings; the old
  single `(app)/index.tsx` home and `(app)/profile.tsx` are replaced;
  `src/components/form.tsx` is deleted in favour of `@pandam/ui` `Field`/`Input`.
- Worker surface: `listings` and `needs` are implemented; `GET /api/v1`,
  `planned.ts` and the surface test updated; `offers` is now the example
  `501` group.
- New worker tests (`test/market.test.ts`, 9) cover auth-required create,
  session-derived ownership, `422` validation, published-only + newest-first +
  cursor discovery, category/text filters, `/mine` scoping, `403` on
  cross-user edit, and draft visibility. All Phase 1–2 tests unchanged and
  green (worker 84, utils 3).
- Deferred, unchanged from earlier phases: offers workflow, realtime chat,
  barter-transaction workflow, reviews, notifications, disputes/admin, R2
  production upload, dark theme, and any AI/credits/payments.
- Known minor polish deferred: the icon font can flash once on a cold web load
  before `@expo/vector-icons` resolves (self-heals, first paint only); the Home
  count labels stay plural ("1 active things you need").
