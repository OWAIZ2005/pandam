# @pandam/ui

The PANDAM cross-platform (iOS / Android / Web) design system. Full reference:
[`docs/architecture/marketplace-ui.md`](../../docs/architecture/marketplace-ui.md) §1.

Primitives are **pure React Native + design tokens** — no NativeWind dependency —
so they render identically on every target. App screens compose these and may
additionally use NativeWind `className` for one-off layout.

## Layout

```
src/
  tokens.ts     colours, spacing, radii, typography, shadows, timings, layout.
                The single source of truth; apps/app/tailwind.config.js is
                derived from the same names. Product cue: "I HAVE" green
                (accent*), "I NEED" coral (need*). Light theme only for now.
  cx.ts         tiny className joiner
  components/
    Text.tsx        Text / Heading — variant (type scale) + tone (semantic colour)
    Button.tsx      primary / secondary / ghost / danger, 3 sizes, loading, icons
    IconButton.tsx  square 44 dp tap target (accessibilityLabel required)
    Screen.tsx      page frame: safe-area, scroll, RefreshControl, centred
                    maxWidth:760 content column, optional sticky footer
    layout.tsx      Stack / Row / Divider (token gap)
    Card.tsx        bordered container; onPress press-scale; elevated shadow
    Badge.tsx       status pill (have / need / neutral / success / warning / danger)
    Chip.tsx        selectable filter pill
    Avatar.tsx      initials disc (image rendering is a hook for when R2 exists)
    Input.tsx       Input / Field (label + hint/error) / SearchInput
    EmptyState.tsx  icon + title + body + optional action
    Skeleton.tsx    Skeleton / SkeletonCard / SkeletonList (native-driver pulse)
  index.ts      barrel — tokens + every component
```

`react` and `react-native` are peer dependencies — the consuming app supplies
the real versions.

## Not here

Domain cards (`ItemCard`, `MatchCard`, `CategoryFilter`, `AppHeader`) live in
`apps/app/src/components/` because they depend on `@pandam/types` and the
router; keeping them out leaves this package free of API/navigation deps.
