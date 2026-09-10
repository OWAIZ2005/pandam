/**
 * PANDAM design tokens — the single source of truth for the visual language.
 *
 * Consumed here by the UI primitives (imperative styles) and by the app's
 * Tailwind config (`apps/app/tailwind.config.js`) so NativeWind utility classes
 * and RN `StyleSheet` values never drift. Light theme only for now.
 *
 * Product cue: "I HAVE" is green (`have*`), "I NEED" is warm coral (`need*`).
 * Screens should reach for these semantic names, never raw hex.
 */

export const palette = {
  green600: '#0E7C5A',
  green700: '#0B6A4D',
  green50: '#E7F3EE',
  coral600: '#DD5A2A',
  coral700: '#B24A1E',
  coral50: '#FBEEE6',
  ink: '#1A1C1A',
  slate600: '#565B56',
  slate400: '#8A8F89',
  cloud: '#FBFBF9',
  white: '#FFFFFF',
  mist: '#F3F4F1',
  line: '#E6E7E2',
  amber600: '#A9700C',
  red600: '#C1362F',
} as const;

export const colors = {
  /** App background. */
  background: palette.cloud,
  /** Default card / sheet surface. */
  surface: palette.white,
  /** Subtle filled surface (inputs, chips, skeletons). */
  surfaceMuted: palette.mist,
  border: palette.line,

  textPrimary: palette.ink,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  textInverse: palette.white,

  /** Brand / primary action / "I HAVE". */
  accent: palette.green600,
  accentStrong: palette.green700,
  accentSoft: palette.green50,

  /** "I NEED". */
  need: palette.coral600,
  needStrong: palette.coral700,
  needSoft: palette.coral50,

  success: palette.green600,
  warning: palette.amber600,
  danger: palette.red600,
} as const;

/** Space scale (dp). */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800' as const },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  h2: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;

export type TypographyVariant = keyof typeof typography;

/** RN shadow presets (also set `elevation` for Android). */
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#1A1C1A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1C1A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const timings = { fast: 120, base: 200, slow: 320 } as const;

/** Max content width on web so the layout is not "mobile UI, but wider". */
export const layout = { contentMaxWidth: 760, touchTarget: 44 } as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;

export const tokens = {
  palette,
  colors,
  spacing,
  radii,
  typography,
  shadows,
  timings,
  layout,
} as const;
