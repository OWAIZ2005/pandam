# @pandam/ui

Cross-platform (iOS / Android / Web) UI foundation.

- `src/tokens.ts` — colour, spacing, radii, type-scale tokens. Single source of
  truth; the app's Tailwind/NativeWind theme is derived from these.
- `src/components/Text.tsx` — the first themed primitive.

`react`, `react-native` and `nativewind` are peer dependencies — the consuming
app supplies the real versions. The design system proper is built on top of this
later; nothing here is final.
