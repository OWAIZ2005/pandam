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
app/                 Expo Router routes (file-based)
  _layout.tsx        root layout: providers + Stack + Sentry init
  index.tsx          "PANDAM — Technical foundation ready." screen
  +not-found.tsx     fallback route
  +html.tsx          web static HTML shell
src/
  lib/env.ts         typed EXPO_PUBLIC_* config
  lib/query.ts       TanStack Query client factory
  lib/monitoring.ts  Sentry init (no-op without DSN)
  lib/analytics.tsx  PostHog provider (passthrough without key)
  providers/AppProviders.tsx  gesture-handler > safe-area > query > analytics
  store/ui.ts        Zustand UI store
  styles/global.css  Tailwind entrypoint (NativeWind)
```

## State model

| Kind              | Tool                       |
| ----------------- | -------------------------- |
| Server data       | TanStack Query             |
| Client / UI state | Zustand (`src/store`)      |
| Form state        | React Hook Form            |
| Validation        | Zod (`@pandam/validation`) |

## Notes

- No feature code yet — this is the foundation only.
- `EAS Build` project id is `REPLACE_ME` in `app.json` — set before building.
- Native folders (`ios/`, `android/`) are gitignored; this is a managed
  (CNG / prebuild) project.
