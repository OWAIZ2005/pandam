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
app/                  Expo Router routes (file-based)
  _layout.tsx         providers + <Stack>
  index.tsx           gate → redirects to (app) or (auth) once auth is known
  (auth)/_layout.tsx  bounces a signed-in user to (app)
  (auth)/login.tsx  (auth)/register.tsx
  (app)/_layout.tsx   guard: bounces a signed-out user to (auth)/login
  (app)/index.tsx     home (email, edit profile, sign out)
  (app)/profile.tsx   edit own profile
  +not-found.tsx  +html.tsx
src/
  lib/env.ts          typed EXPO_PUBLIC_* config (EXPO_PUBLIC_API_URL)
  lib/api/client.ts   the one fetch wrapper (credentials, Bearer, ApiError)
  lib/api/{auth,profile}.ts   typed endpoint calls
  lib/auth/hooks.ts   useSession / useLogin / useRegister / useLogout
  lib/auth/AuthBootstrap.tsx  loads the native token before first render
  lib/session/storage.ts  expo-secure-store on native, no-op on web
  lib/query.ts  lib/monitoring.ts  lib/analytics.tsx
  components/{form,Splash}.tsx
  providers/AppProviders.tsx  gesture-handler > safe-area > query > analytics > auth
  store/ui.ts         Zustand UI store (theme / onboarding only)
```

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

- Only the auth + profile screens exist — the marketplace UI is a later phase.
- `EAS Build` project id is `REPLACE_ME` in `app.json` — set before building.
- Native folders (`ios/`, `android/`) are gitignored; this is a managed
  (CNG / prebuild) project.
