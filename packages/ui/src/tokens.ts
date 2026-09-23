/**
 * PANDAM design tokens — the single source of truth for the visual language.
 *
 * Consumed here by the UI primitives (imperative styles) and by the app's
 * Tailwind config (`apps/app/tailwind.config.js`) so NativeWind utility classes
 * and RN `StyleSheet` values never drift. Light theme only for now.
 *
 * ---------------------------------------------------------------------------
 * ART DIRECTION
 *
 * PANDAM is a warm, premium marketplace, not a SaaS dashboard: cream ground,
 * espresso-brown ink, terracotta as the one confident brand colour, and sage
 * reserved for positive/success moments. Colour is reserved for MEANING, never
 * used as wallpaper:
 *
 *   terracotta (`accent*`)  primary brand — "I HAVE", the main action
 *   clay (`need*`)          "I NEED"      — the thing you are asking for
 *   sage (`match*`)         RECIPROCAL    — they want yours, you want theirs
 *
 * The reciprocal match is the moment the whole product exists for, so it is
 * the ONE place allowed to use a gradient and a coloured glow. A filled
 * button, a card, an avatar and a badge are all flat: if everything shouts,
 * the match moment cannot.
 *
 * Screens should reach for the semantic names (`colors.accent`), never a raw
 * hex and never a `palette.*` ramp value.
 * ---------------------------------------------------------------------------
 */

/* -------------------------------------------------------------------------- */
/* Raw ramps                                                                  */
/* -------------------------------------------------------------------------- */

export const palette = {
  // Terracotta — primary brand, "I HAVE", primary actions.
  terracotta50: '#FBEFE7',
  terracotta100: '#F3D7C2',
  terracotta200: '#E6C5A8',
  terracotta400: '#C7774F',
  terracotta500: '#AD5B37',
  terracotta600: '#9A4828',
  terracotta700: '#7A3820',
  terracotta900: '#4C2313',

  // Clay — "I NEED". A warm ochre that sits beside terracotta without competing.
  clay50: '#FBF1E4',
  clay100: '#F3DCB6',
  clay200: '#E8C489',
  clay400: '#C68A3D',
  clay500: '#AD7328',
  clay600: '#8C5C1E',
  clay700: '#6B4517',

  // Sage — reciprocal barter matches. The product's one moment of spectacle.
  sage50: '#F1F4ED',
  sage100: '#DEE6D3',
  sage200: '#C1D0AE',
  sage400: '#8FA377',
  sage500: '#7E9168',
  sage600: '#647550',
  sage700: '#4C593D',

  /*
   * Neutrals, warm cream-leaning so the canvas never reads clinical.
   *
   * `ground` (#F7F0E7) is the warm creamy background; `surface` (#FFFDF9) sits
   * a perceptible step above it, so a card is legible from a hairline border
   * alone without needing a shadow just to read as a surface.
   */
  ink: '#241B16',
  espresso800: '#3A2B22',
  espresso700: '#4E3B2F',
  espresso600: '#5F493A',
  /** Lightest neutral that still passes AA for small text on the cream ground. */
  espresso500: '#75675C',
  /** Decorative only — fails AA for body copy. See `colors.textFaint`. */
  espresso400: '#9C8E80',
  espresso300: '#C2B6A6',
  line: '#E6DCCB',
  lineSoft: '#EFE7D9',
  mist: '#EFE5D8',
  ground: '#F7F0E7',
  white: '#FFFDF9',

  // Feedback. Text-safe by default: these appear on small labels constantly.
  red600: '#B23A2E',
  red700: '#8C2C22',
  red50: '#FBEBE7',
  yellow700: '#8A5D06',
  yellow50: '#FBF1DE',
  blue600: '#3D6E8C',
  blue50: '#E9F1F5',
} as const;

/* -------------------------------------------------------------------------- */
/* Semantic colours                                                           */
/* -------------------------------------------------------------------------- */

export const colors = {
  /** App background. */
  background: palette.ground,
  /** Secondary background — elevated section fills, alternating rows. */
  backgroundSecondary: palette.mist,
  /** Default card / sheet surface — one perceptible step above `background`. */
  surface: palette.white,
  /** Subtle filled surface (inputs at rest, chips, skeletons). */
  surfaceMuted: palette.mist,
  /** Pressed/hovered state for a surface that is interactive. */
  surfaceHover: '#EFE3D3',
  /** Deep surface used behind hero headers. */
  surfaceInverse: palette.ink,

  /** Hairline rule. One border colour for the whole product. */
  border: palette.line,
  /** Even quieter divider, for rules inside an already-bordered container. */
  borderSoft: palette.lineSoft,
  /** Border on a control that has focus or is selected. */
  borderStrong: palette.espresso300,

  textPrimary: palette.ink,
  textSecondary: palette.espresso500,
  /** Supporting copy. AA-compliant, unlike a low-contrast grey. */
  textMuted: palette.espresso500,
  /**
   * Deliberately below AA — only for decoration that repeats information
   * already available elsewhere (a chevron, a separator dot, a placeholder
   * glyph). Never the only carrier of meaning, never body copy.
   */
  textFaint: palette.espresso400,
  textInverse: palette.white,

  /** Brand / primary action / "I HAVE". */
  accent: palette.terracotta600,
  accentStrong: palette.terracotta700,
  accentBright: palette.terracotta400,
  accentSoft: palette.terracotta50,
  accentBorder: palette.terracotta200,
  /** Use when terracotta carries small text — passes AA on white and on tints. */
  accentText: palette.terracotta700,

  /** "I NEED". */
  need: palette.clay500,
  needStrong: palette.clay700,
  needBright: palette.clay400,
  needSoft: palette.clay50,
  needBorder: palette.clay200,
  needText: palette.clay700,

  /** Reciprocal barter match. */
  match: palette.sage500,
  matchStrong: palette.sage700,
  matchBright: palette.sage400,
  matchSoft: palette.sage50,
  matchBorder: palette.sage200,
  matchText: palette.sage700,

  success: palette.sage600,
  successSoft: palette.sage50,
  successText: palette.sage700,
  warning: palette.yellow700,
  warningSoft: palette.yellow50,
  warningText: palette.yellow700,
  danger: palette.red600,
  dangerStrong: palette.red700,
  dangerSoft: palette.red50,
  dangerText: palette.red700,
  info: palette.blue600,
  infoSoft: palette.blue50,
  infoText: palette.blue600,
  infoBorder: '#C4D8E3',
  warningBorder: '#EAD3A6',
  dangerBorder: '#EDC3B9',
  /** Deeper pressed fill for a muted control. */
  surfacePressed: '#E6D8C6',

  /** Keyboard focus ring. Deliberately the brand colour, never the OS blue. */
  focus: palette.terracotta500,
  /** Scrim behind a modal or sheet. */
  scrim: 'rgba(36, 27, 22, 0.44)',
} as const;

/* -------------------------------------------------------------------------- */
/* Gradients                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Two-stop gradients, `readonly [from, to]`, consumed by `<Gradient>`.
 *
 * Reserved, not decorative. `match` is the reciprocal-match moment; `hero` is
 * the unauthenticated splash; `ink` is a dark header. Buttons, cards, badges
 * and avatars are all flat by design — see the art-direction note at the top.
 * The `cover*` set is the fallback when an item has no photograph, where the
 * job is to make a wall of imageless cards look varied rather than broken.
 */
export const gradients = {
  match: [palette.sage400, palette.sage600],
  hero: [palette.terracotta600, palette.terracotta900],
  ink: [palette.espresso800, palette.ink],
  /*
   * Deterministic covers for items that have no photograph.
   *
   * Deliberately DESATURATED. An earlier pass used full-chroma gradients and
   * a grid of them read as a colour-swatch page: the covers shouted over the
   * titles, and — worse — a real photograph looked washed out next to them.
   * The fallback has to be quieter than the thing it stands in for, so these
   * are low-saturation warm-neutral tints that give each card a distinct
   * identity without competing for attention.
   */
  cover1: ['#8A7A64', '#5C4E3B'],
  cover2: ['#9C7A5C', '#6B4E37'],
  cover3: ['#8A7E8C', '#5A4E5C'],
  cover4: ['#7E8A80', '#4E5C50'],
  cover5: ['#9C7470', '#6B4740'],
  cover6: ['#847A6E', '#54493E'],
} as const;

export type GradientToken = keyof typeof gradients;

/** Stable gradient pick for a string (category id, item id, name). */
const COVER_KEYS = ['cover1', 'cover2', 'cover3', 'cover4', 'cover5', 'cover6'] as const;

export function coverFor(seed: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const key = COVER_KEYS[h % COVER_KEYS.length] ?? 'cover1';
  return gradients[key];
}

/* -------------------------------------------------------------------------- */
/* Space, radius, type                                                        */
/* -------------------------------------------------------------------------- */

/** Space scale (dp). A 4-based rhythm; everything in the product is one of these. */
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
  '6xl': 72,
} as const;

/**
 * Radius. Controls and containers are deliberately DIFFERENT: a button at the
 * same radius as the card holding it makes both read as stickers. Controls sit
 * tighter (12), containers generously soft (18), and the full pill is reserved
 * for things that are genuinely pill-shaped — filter chips, badges, avatars.
 */
export const radii = {
  none: 0,
  xs: 4,
  /** Inline marks: badges on a dense row, tags, small swatches. */
  sm: 8,
  /** Controls: buttons, inputs, segmented controls. */
  md: 12,
  /** Containers: cards, sheets, tiles. Generous — the warm redesign is soft-cornered. */
  lg: 18,
  xl: 24,
  '2xl': 30,
  pill: 999,
} as const;

/**
 * Type scale.
 *
 * Three weights only — 400 regular, 500 medium, 600 semibold — plus 700 for
 * the two display sizes. The previous scale ran four sizes at weight 800,
 * which made every screen shout and left no room to emphasise anything.
 * Negative tracking is applied in proportion to size, which is what stops
 * large type reading as a browser default heading.
 */
export const typography = {
  hero: { fontSize: 32, lineHeight: 37, fontWeight: '700' as const, letterSpacing: -0.9 },
  display: { fontSize: 27, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.7 },
  h1: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.45 },
  h2: { fontSize: 18.5, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, lineHeight: 21, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.08 },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1 },
  bodySm: { fontSize: 13.5, lineHeight: 19.5, fontWeight: '400' as const, letterSpacing: 0 },
  /** Form labels, inline actions, chip text. */
  label: { fontSize: 13, lineHeight: 17, fontWeight: '500' as const, letterSpacing: -0.05 },
  /** Metadata, helper text, timestamps. */
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0 },
  /**
   * All-caps eyebrow. Used sparingly — one per section at most. Tracking is
   * wide because caps at this size are unreadable without it.
   */
  overline: { fontSize: 10.5, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.6 },
  /**
   * Money and counts. Pair with `<Text numeric>`, which adds tabular figures
   * so a column of numbers does not jitter as digits change. The figure
   * setting lives on the component rather than here because this module is
   * also imported by `tailwind.config.js` and must stay free of React Native
   * types.
   */
  numeric: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: -0.1 },
  numericLarge: { fontSize: 24, lineHeight: 29, fontWeight: '600' as const, letterSpacing: -0.5 },
} as const;

export type TypographyVariant = keyof typeof typography;

/* -------------------------------------------------------------------------- */
/* Elevation & motion                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Elevation presets.
 *
 * Restrained on purpose. With real separation between `background` and
 * `surface`, a card is legible from its hairline border alone, so a shadow's
 * only job is to say "this floats above the page" — sheets, sticky bars, menus.
 * Everything is a tight, near-vertical, low-opacity shadow; nothing blooms.
 */
/** Warm espresso shadow colour — a black shadow on cream reads grey and dirty. */
const SHADOW = '#5A3A22';

export const shadows = {
  none: {},
  /** Barely there. A card that should feel attached to the page. */
  xs: {
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  /** A resting card on the cream ground — soft, warm, slightly diffused. */
  sm: {
    shadowColor: SHADOW,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** A lifted card — hovered, held, or a hero tile. */
  md: {
    shadowColor: SHADOW,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  /** Modals, sheets, floating objects. */
  lg: {
    shadowColor: SHADOW,
    shadowOpacity: 0.16,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
} as const;

/**
 * Coloured glow.
 *
 * Deliberately NOT used by buttons any more — a halo under every primary
 * action is the fastest way to make software look generated. Kept for the
 * reciprocal-match surfaces, where the product genuinely wants to celebrate.
 */
export function glow(color: string, opacity = 0.22) {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  } as const;
}

/**
 * Focus ring for keyboard navigation. Two rings — brand colour plus a white
 * gap — so it stays visible on both light surfaces and coloured buttons.
 */
export const focusRing = {
  outlineStyle: 'solid',
  outlineWidth: 2,
  outlineColor: colors.focus,
  outlineOffset: 2,
} as const;

/**
 * Durations (ms). Interface motion should be quick enough to feel like
 * response rather than animation: nothing in the product exceeds 240ms.
 */
export const timings = { instant: 90, fast: 140, base: 200, slow: 240 } as const;

/** Spring presets for `Animated.spring` press feedback. */
export const springs = {
  press: { damping: 22, stiffness: 380, mass: 0.5 },
  enter: { damping: 24, stiffness: 200, mass: 0.8 },
  /** Soft settle for tilt/depth returning to rest. */
  tilt: { damping: 16, stiffness: 160, mass: 0.7 },
} as const;

/**
 * Ambient motion (ms). The ONE exception to the 240ms ceiling: slow idle loops
 * on decorative objects (empty states, the match moment). Never on controls,
 * and always disabled under reduced motion.
 */
export const ambient = { float: 3200, drift: 5200, pulse: 1800 } as const;

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export const layout = {
  /** Max content width on web so the layout is not "mobile UI, but wider". */
  contentMaxWidth: 720,
  /** Reading measure for long prose — narrower than the content column. */
  proseMaxWidth: 560,
  /** Minimum tap target. Anything interactive must reach this, via hitSlop if small. */
  touchTarget: 44,
  /** Horizontal page gutter. */
  gutter: spacing.xl,
  /** Tighter gutter for dense rows inside an already-padded container. */
  gutterTight: spacing.lg,
  /**
   * Comfortable breathing room under the last item on a scrollable tab
   * screen. The tab bar is docked (not floating), so React Navigation already
   * reserves its own space — this is padding, not overlap avoidance.
   */
  tabBarInset: 28,
  /** Hairline width. One value, so borders never disagree across components. */
  hairline: 1,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;

export const tokens = {
  palette,
  colors,
  gradients,
  spacing,
  radii,
  typography,
  shadows,
  focusRing,
  timings,
  springs,
  ambient,
  layout,
} as const;
