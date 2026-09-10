# PANDAM — Marketplace UI & design system

Phase 3 built the **product surface** on top of the domain (Phase 1) and auth
(Phase 2) foundations: a cross-platform design system (`@pandam/ui`), the app
navigation shell, and the "I HAVE" / "I NEED" / discovery / matches / profile
screens — wired to real API data with real loading / empty / error states.

It did **not** build offers, chat, transactions, reviews, notifications, an
admin/dispute console, or production R2 image upload — those remain out of scope
(see [`domain.md`](domain.md) for the full deferred list).

## 1. Design system — `@pandam/ui`

One package, consumed by iOS, Android and web. Primitives are **pure React
Native + tokens** — no NativeWind dependency — so they render identically on
every target. App screens compose them and may additionally use NativeWind
`className` for one-off layout.

### Tokens (`src/tokens.ts`)

The single source of truth for the visual language. The app's Tailwind theme
(`apps/app/tailwind.config.js`) is derived from the same names, so utility
classes and `StyleSheet` values never drift.

| Group        | Names                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`     | `background` `surface` `surfaceMuted` `border` · `textPrimary/Secondary/Muted/Inverse` · `accent`/`accentStrong`/`accentSoft` (**I HAVE**, green) · `need`/`needStrong`/`needSoft` (**I NEED**, coral) · `success` `warning` `danger` |
| `spacing`    | `none xxs xs sm md lg xl 2xl 3xl 4xl 5xl` (0–56 dp)                                                                                                                                                                                   |
| `radii`      | `none sm md lg xl pill`                                                                                                                                                                                                               |
| `typography` | `display h1 h2 h3 body bodyStrong bodySm label caption` (size + line-height + weight)                                                                                                                                                 |
| `shadows`    | `none sm md` (each also sets Android `elevation`)                                                                                                                                                                                     |
| `timings`    | `fast 120` · `base 200` · `slow 320` (ms)                                                                                                                                                                                             |
| `layout`     | `contentMaxWidth 760` · `touchTarget 44`                                                                                                                                                                                              |

Light theme only for now; a dark palette slots in by adding a second token set.

### Primitives (`src/components/`)

| Component                                    | Purpose                                                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Text` / `Heading`                           | Typographic primitive: `variant` picks the scale, `tone` picks a semantic colour.                                                                                   |
| `Button`                                     | `primary` / `secondary` / `ghost` / `danger` × `sm`/`md`/`lg`; `loading`, `fullWidth`, icons. 44 dp min, `accessibilityRole="button"`, busy state.                  |
| `IconButton`                                 | Square 44 dp tap target; `accessibilityLabel` required.                                                                                                             |
| `Screen`                                     | Page frame: safe-area edges, optional scroll, `RefreshControl`, centred `maxWidth: 760` content column (so web is not "mobile, but wider"), optional sticky footer. |
| `Stack` / `Row` / `Divider`                  | Flex layout with token `gap`.                                                                                                                                       |
| `Card`                                       | Bordered `radii.lg` container; `onPress` adds a subtle press-scale; `elevated` adds `shadows.sm`.                                                                   |
| `Badge`                                      | Status pill — `have` / `need` / `neutral` / `success` / `warning` / `danger`.                                                                                       |
| `Chip`                                       | Selectable filter pill; `accessibilityState={{ selected }}`.                                                                                                        |
| `Avatar`                                     | Initials disc (up to two words). Image rendering is a documented hook for when R2 exists — no fake URLs today.                                                      |
| `Input` / `Field` / `SearchInput`            | Text entry with `invalid` state; `Field` adds label + hint/error and an `accessibilityLabel`; `SearchInput` is the pill search box.                                 |
| `EmptyState`                                 | Centered icon + title + body + optional action button.                                                                                                              |
| `Skeleton` / `SkeletonCard` / `SkeletonList` | Pulsing placeholders (native-driver opacity loop). Every list uses these, not spinners.                                                                             |

Domain cards live in the app (`apps/app/src/components/`), not the package,
because they depend on API types and navigation: `ItemCard` (a listing/need
summary), `MatchCard` (the 2×2 reciprocity grid), `CategoryFilter`, `AppHeader`,
plus the `states.tsx` helpers (`ErrorState`, `QueryState`).

## 2. Navigation shell

Expo Router, nested route groups:

```
app/
  (auth)/         login · register            — redirects to (app) if signed in
  (app)/          _layout guard → Splash / redirect to (auth)/login
    (tabs)/       the bottom tab bar
      index         HOME
      discover      DISCOVER
      create        CREATE   (emphasised — green disc, no label)
      matches       MATCHES
      profile       PROFILE
    new-listing · new-need           (modal presentation)
    listing/[id]/index · listing/[id]/edit
    need/[id]/index    · need/[id]/edit
    match/[key]
    edit-profile
```

- **Mobile:** five-item bottom tab bar, Create rendered as a raised accent disc.
- **Web:** the same routes, but every screen renders inside `Screen`'s centred
  `760 px` column. Wide, not stretched.
- All internal navigation targets are normalised to `/(app)/(tabs)` and
  `/(app)/(tabs)/<tab>`.

## 3. Screens

| Screen                           | Content                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home** (`index`)               | Greeting; "Add something I have / I need" quick actions; active-item counts; up to two barter matches; browse-by-category chips; recent published items. Pull-to-refresh. Every section has its own skeleton / error / empty branch.             |
| **Discover**                     | `SearchInput` (debounced 350 ms) + I HAVE / I NEED toggle + category chips. Infinite `FlatList` of `ItemCard`; `onEndReached` → next page; empty state offers "Clear filters"; footer shows a next-page skeleton or "You're all caught up".      |
| **Create**                       | Two big choices (I HAVE green → `new-listing`, I NEED coral → `new-need`) + a plain-language explainer of how a reciprocal match happens ("no money changes hands").                                                                             |
| **Matches**                      | `FlatList` of `MatchCard`; each row opens `match/[key]`. Empty state points to Discover. Footer explains matches come from "an exact, explainable rule".                                                                                         |
| **Profile**                      | Avatar + display name + `@username` + bio + coarse location; "Edit profile"; the user's own I HAVE and I NEED items (all statuses, with a status `Badge`); "Sign out". No precise location, nothing sensitive.                                   |
| **New listing / need**           | `ItemForm` (RHF + Zod), `mode="create"`.                                                                                                                                                                                                         |
| **Listing / need detail**        | Title, HAVE/NEED badge, status badge, category · type · "time ago", description, owner row. **Owner** sees "Edit" + status-action buttons. **Non-owner** sees a disabled "Offer a trade" and an honest note that offers arrive in a later phase. |
| **Listing / need edit**          | `ItemForm` `mode="edit"`, pre-filled; on save, patches fields and (if changed) status, then returns to the detail.                                                                                                                               |
| **Match detail** (`match/[key]`) | "Perfect reciprocal barter" banner + a panel per party (has / needs, category · type). Disabled "Make an offer" + note. "See more of what they have" → Discover filtered to that category.                                                       |
| **Edit profile**                 | `Field`s for display name, username, bio, coarse city; shared `@pandam/validation` rules.                                                                                                                                                        |

### Image handling

`ItemForm` uses `expo-image-picker` to let a user pick photos. They are shown as
`expo-image` thumbnails under the label **"Local preview only — photo upload
arrives with cloud storage, so these aren't saved yet"** and are **not**
submitted. No fake permanent URLs are created; R2 is not provisioned
([`domain.md` §11](domain.md)).

## 4. Backend endpoints added

`listings` ("I HAVE") and `needs` ("I NEED") are identical shapes, so one Hono
factory — `createMarketRoute(kind)` in
`apps/worker/src/routes/api/v1/market.ts` — serves both. They graduated from
`501 not_implemented` to implemented; `GET /api/v1` and `planned.ts` reflect
that.

| Method & path                              | Auth     | Behaviour                                                                                                                                                                                                                        |
| ------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/{listings,needs}`             | optional | Public discovery. **Published only.** Filters: `category`, `type`, `q` (title/description, LIKE-escaped), `owner`. Keyset pagination on `(createdAt desc, id desc)` via an opaque base64url `cursor`; `limit` 1–50 (default 20). |
| `GET /api/v1/{listings,needs}/mine`        | required | The caller's own items, **every status**.                                                                                                                                                                                        |
| `POST /api/v1/{listings,needs}`            | required | Create. `ownerId` is **always** the session user — a client-supplied owner id is ignored.                                                                                                                                        |
| `GET /api/v1/{listings,needs}/:id`         | optional | One item. A non-published item is `404` to everyone except its owner.                                                                                                                                                            |
| `PATCH /api/v1/{listings,needs}/:id`       | required | Update fields. `404` if missing, `403` if not the owner.                                                                                                                                                                         |
| `POST /api/v1/{listings,needs}/:id/status` | required | Change publication status (draft ↔ published ↔ paused ↔ archived). Same 404/403 rules.                                                                                                                                           |

`GET /api/v1/matches` was extended: it still runs the unchanged pure matcher
(`domain/matching.ts`), then **hydrates** the four item ids per match into a
`you ↔ them` view (`ReciprocalMatchView`) with titles, categories and owner
display names, via a `Map`-based batch fetch (`market.listingsByIds` /
`needsByIds`). No score, no "AI matched".

### Read model

Cross-entity JOINs (item + owner profile + category) live in a dedicated
repository, `packages/database/src/repositories/market.ts`
(`marketRepository(db)`), so the plain `listings` / `needs` repos stay simple
CRUD. Every row it returns carries only the **public** slice of the owner
(`id`, `displayName`, `username`).

### Shared validation

`packages/validation/src/discovery.ts` — `discoverQuerySchema` (the query-string
contract, used by both the Worker route and the client query builder). Create /
update / status schemas already existed from Phase 1 (`listing.ts`, `need.ts`).

## 5. Client API integration

No screen calls `fetch` directly. Layers:

```
src/lib/api/{categories,market,matches}.ts   typed endpoint wrappers over api.*
src/lib/query/keys.ts                         qk.* — one key factory
src/lib/hooks/useMarket.ts                    useDiscover (infinite) · useMyItems ·
                                              useItem · useCreateItem · useUpdateItem ·
                                              useSetItemStatus
src/lib/hooks/{useCategories,useMatches,useDebounced}.ts
src/lib/format.ts                             timeAgo, STATUS_LABEL, statusBadgeKind, TYPE_LABEL
```

Mutations invalidate `qk.market.all(kind)` **and** `qk.matches` (a listing/need
change can make or break a match), and write the fresh item straight into
`qk.market.detail(...)`. `useDiscover` is a `useInfiniteQuery` keyed by the
filter object; `getNextPageParam` reads `nextCursor`.

## 6. States, accessibility, performance

- **Loading:** `SkeletonList` / `SkeletonCard` everywhere a list or card loads —
  never a bare spinner.
- **Empty:** every list/section has a purpose-written `EmptyState` with a next
  action (usually "add something" or "explore Discover").
- **Error:** `ErrorState` maps `status` to a friendly line — `0` network, `401/403`
  permission, `>= 500` server — with a **Retry** that re-runs the query.
- **Accessibility:** `accessibilityRole` / `accessibilityLabel` on every control,
  44 dp minimum targets, `accessibilityState` for busy/selected, `Field` labels
  wired to inputs, focusable controls for web keyboard nav.
- **Performance:** `expo-image`, query caching + keyset pagination, debounced
  search, memoised filter objects, native-driver skeleton animation. `FlatList`
  is used for the unbounded Discover / Matches lists.

## 7. What is deliberately not here

Offers workflow · realtime chat · barter-transaction workflow · reviews ·
notifications · disputes / admin · production R2 upload · AI / ML / embeddings ·
credits / currency / payments. Unsupported actions in the UI are **disabled with
an honest note**, never faked. See [`domain.md` §9–§11](domain.md) and
[`0004-marketplace-ui-and-design-system.md`](../decisions/0004-marketplace-ui-and-design-system.md).
