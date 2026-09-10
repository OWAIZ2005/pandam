# @pandam/app

The universal PANDAM application — one codebase for **iOS, Android and Web**.

Expo · Expo Router · React Native · React Native Web · TypeScript · NativeWind ·
Reanimated · Gesture Handler · TanStack Query · Zustand · React Hook Form · Zod ·
expo-image · Sentry · PostHog.

## Run

```bash
pnpm --filter @pandam/app dev        # Expo dev server on port 3000
# press w for web, i for iOS simulator, a for Android emulator
pnpm --filter @pandam/app dev:web    # straight to web
```

Web dev runs on **http://localhost:3000**.

## Structure

```
app/                  Expo Router routes (file-based, nested groups)
  _layout.tsx         providers + <Stack>
  index.tsx           gate → redirects to (app)/(tabs) or (auth)/login
  (auth)/_layout.tsx  bounces a signed-in user to (app)/(tabs)
  (auth)/login.tsx  (auth)/register.tsx
  (app)/_layout.tsx   guard: Splash while auth resolves, else (auth)/login
    (tabs)/_layout.tsx      bottom tab bar (Create emphasised)
    (tabs)/index.tsx        HOME — quick actions, counts, matches, categories, recent
    (tabs)/discover.tsx     DISCOVER — search + filters + infinite list
    (tabs)/create.tsx       CREATE — I HAVE / I NEED choice + explainer
    (tabs)/matches.tsx      MATCHES — reciprocal candidates
    (tabs)/profile.tsx      PROFILE — profile card + own items + sign out
    new-listing.tsx  new-need.tsx           (modal) create forms
    listing/[id]/index.tsx  listing/[id]/edit.tsx
    need/[id]/index.tsx     need/[id]/edit.tsx
    match/[key].tsx         reciprocity detail
    edit-profile.tsx
  +not-found.tsx  +html.tsx
src/
  lib/env.ts          typed EXPO_PUBLIC_* config (EXPO_PUBLIC_API_URL)
  lib/api/client.ts   the one fetch wrapper (credentials, Bearer, ApiError)
  lib/api/{auth,profile,categories,market,matches}.ts   typed endpoint calls
  lib/query/keys.ts   qk.* query-key factory
  lib/hooks/useMarket.ts   useDiscover / useMyItems / useItem / useCreate|Update|SetStatus
  lib/hooks/{useCategories,useMatches,useDebounced}.ts
  lib/format.ts       timeAgo, STATUS_LABEL, statusBadgeKind, TYPE_LABEL
  lib/auth/hooks.ts   useSession / useLogin / useRegister / useLogout
  lib/session/storage.ts  expo-secure-store on native, no-op on web
  components/         Splash + domain cards: ItemCard, MatchCard, CategoryFilter,
                      AppHeader, ItemForm, ItemDetail, ItemEditScreen, states.tsx
  providers/AppProviders.tsx  gesture-handler > safe-area > query > analytics > auth
  store/ui.ts         Zustand UI store (theme / onboarding only)
```

UI primitives and design tokens come from
[`@pandam/ui`](../../packages/ui/README.md); `tailwind.config.js` maps the same
token names for `className` layout.

## State model

| Kind                     | Tool                                                 |
| ------------------------ | ---------------------------------------------------- |
| Server data (incl. auth) | TanStack Query — auth is the `['auth','me']` entry   |
| Client / UI state        | Zustand (`src/store`) — theme / onboarding, not auth |
| Form state               | React Hook Form                                      |
| Validation               | Zod (`@pandam/validation`)                           |

## Auth

Web uses the API's HttpOnly session cookie; native stores the token in
`expo-secure-store` and sends it as a Bearer header. `useSession()` is the
single source of truth; route groups render a `<Splash>` until it resolves so
the app never flashes the wrong screen. See
[`docs/architecture/auth.md`](../../docs/architecture/auth.md).

## Notes

- Screens: auth, home, discovery, create, matches, profile, and listing/need
  create·edit·detail — all on real API data with skeleton / empty / error
  states. Offers, chat, transactions, reviews and notifications are **not**
  built; those actions render disabled with an honest note. Photo picking is a
  local `expo-image` preview only — nothing is uploaded (R2 not provisioned).
  See [`docs/architecture/marketplace-ui.md`](../../docs/architecture/marketplace-ui.md).
- `EAS Build` project id is `REPLACE_ME` in `app.json` — set before building.
- Native folders (`ios/`, `android/`) are gitignored; this is a managed
  (CNG / prebuild) project.
