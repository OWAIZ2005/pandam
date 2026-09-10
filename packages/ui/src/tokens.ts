/**
 * PANDAM design tokens.
 *
 * The single source of truth for colour / spacing / radii / typography scale.
 * Consumed both here (component styles) and by the app's Tailwind config so
 * NativeWind utility classes and imperative styles stay in sync. This is a
 * starting point, not the finished design system.
 */
export const colors = {
  // brand
  primary: '#1E7A4C',
  primaryFg: '#FFFFFF',
  // surfaces
  background: '#FFFFFF',
  surface: '#F4F5F7',
  border: '#E2E4E9',
  // text
  text: '#12141A',
  textMuted: '#5B6270',
  // status
  danger: '#C1362F',
  success: '#1E7A4C',
} as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;
export type FontSizeToken = keyof typeof fontSize;

export const tokens = { colors, spacing, radii, fontSize } as const;
