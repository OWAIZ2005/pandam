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
 * PANDAM is about two people agreeing a fair exchange. The product should feel
 * like a well-kept ledger, not a casino: warm neutral ground, near-black ink,
 * hairline rules, and type carrying the hierarchy. Colour is reserved for
 * MEANING, never used as wallpaper:
 *
 *   emerald (`accent*`)  "I HAVE"   — the thing you are offering
 *   tangerine (`need*`)  "I NEED"   — the thing you are asking for
 *   violet (`match*`)    RECIPROCAL — they want yours, you want theirs
 *
 * That last one is the moment the whole product exists for, so it is the ONE
 * place allowed to use a gradient and a coloured glow. A filled button, a
 * card, an avatar and a badge are all flat: if everything shouts, the match
 * moment cannot.
 *
 * Screens should reach for the semantic names (`colors.accent`), never a raw
 * hex and never a `palette.*` ramp value.
 * ---------------------------------------------------------------------------
 */

/* -------------------------------------------------------------------------- */
/* Raw ramps                                                                  */
/* -------------------------------------------------------------------------- */

export const palette = {
  // Emerald — "I HAVE", primary actions.
  emerald50: '#ECF7F1',
  emerald100: '#CFEBDC',
  emerald200: '#A3D8BE',
  emerald400: '#2FB278',
  emerald500: '#12A163',
  emerald600: '#088352',
  emerald700: '#05653F',
  emerald900: '#043D28',

  // Tangerine — "I NEED".
  amber50: '#FDF2E9',
  amber100: '#FADEC6',
  amber200: '#F4BE93',
  amber400: '#E8802F',
  amber500: '#D2650F',
  amber600: '#B0500A',
  amber700: '#8A3D06',

  // Violet — reciprocal matches. The product's one moment of spectacle.
  violet50: '#F2EEFD',
  violet100: '#E2D8FB',
  violet200: '#C6B3F7',
  violet400: '#8F63F0',
  violet500: '#7340E0',
  violet600: '#5B2CC2',
  violet700: '#441F94',

  /*
   * Neutrals, warm-leaning so the canvas never reads clinical.
   *
   * `ground` sits a perceptible step below `white`: the previous canvas was
   * only ~1% off white, so every card needed a shadow just to be seen as a
   * surface. With real separation a hairline border is enough, which is what
   * lets the shadows come down to almost nothing.
   */
  ink: '#121619',
  slate800: '#1E262C',
  slate700: '#39434B',
  slate600: '#4A555E',
  /** Lightest neutral that still passes AA for small text on white (4.6:1). */
  slate500: '#6B7680',
  /** Decorative only — fails AA for body copy. See `colors.textFaint`. */
  slate400: '#98A2AB',
  slate300: '#C4CBD1',
  line: '#E3E7E9',
  lineSoft: '#EDF0F1',
  mist: '#F1F2F0',
  ground: '#F6F6F4',
  white: '#FFFFFF',

  // Feedback. Text-safe by default: these appear on small labels constantly.
  red600: '#C22F35',
  red700: '#9B2126',
  red50: '#FDEDED',
  yellow700: '#8A5D06',
  yellow50: '#FDF4E3',
  blue600: '#0A6FBF',
  blue50: '#E9F2FA',
} as const;

/* -------------------------------------------------------------------------- */
/* Semantic colours                                                           */
/* -------------------------------------------------------------------------- */

export const colors = {
  /** App background. */
  background: palette.ground,
  /** Default card / sheet surface — one perceptible step above `background`. */
  surface: palette.white,
  /** Subtle filled surface (inputs at rest, chips, skeletons). */
  surfaceMuted: palette.mist,
  /** Pressed/hovered state for a surface that is interactive. */
  surfaceHover: '#F0F1EE',
  /** Deep surface used behind hero headers. */
  surfaceInverse: palette.ink,

  /** Hairline rule. One border colour for the whole product. */
  border: palette.line,
  /** Even quieter divider, for rules inside an already-bordered container. */
  borderSoft: palette.lineSoft,
  /** Border on a control that has focus or is selected. */
  borderStrong: palette.slate300,

  textPrimary: palette.ink,
  textSecondary: palette.slate600,
  /** Supporting copy. AA-compliant, unlike the old muted grey. */
  textMuted: palette.slate500,
  /**
   * Deliberately below AA — only for decoration that repeats information
   * already available elsewhere (a chevron, a separator dot, a placeholder
   * glyph). Never the only carrier of meaning, never body copy.
   */
  textFaint: palette.slate400,
  textInverse: palette.white,

  /** Brand / primary action / "I HAVE". */
  accent: palette.emerald600,
  accentStrong: palette.emerald700,
  accentBright: palette.emerald500,
  accentSoft: palette.emerald50,
  accentBorder: palette.emerald200,
  /** Use when emerald carries small text — passes AA on white and on tints. */
  accentText: palette.emerald700,

  /** "I NEED". */
  need: palette.amber500,
  needStrong: palette.amber700,
  needBright: palette.amber400,
  needSoft: palette.amber50,
  needBorder: palette.amber200,
  needText: palette.amber700,

  /** Reciprocal barter match. */
  match: palette.violet500,
  matchStrong: palette.violet700,
  matchBright: palette.violet400,
  matchSoft: palette.violet50,
  matchBorder: palette.violet200,
  matchText: palette.violet700,

  success: palette.emerald600,
  successSoft: palette.emerald50,
  successText: palette.emerald700,
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

  /** Keyboard focus ring. Deliberately the brand colour, never the OS blue. */
  focus: palette.emerald500,
  /** Scrim behind a modal or sheet. */
  scrim: 'rgba(18, 22, 25, 0.44)',
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
  match: [palette.violet400, palette.violet600],
  hero: [palette.emerald600, palette.emerald900],
  ink: [palette.slate800, palette.ink],
  /*
   * Deterministic covers for items that have no photograph.
   *
   * Deliberately DESATURATED. An earlier pass used full-chroma gradients and
   * a grid of them read as a colour-swatch page: the covers shouted over the
   * titles, and — worse — a real photograph looked washed out next to them.
   * The fallback has to be quieter than the thing it stands in for, so these
   * are low-saturation slate/stone tints that give each card a distinct
   * identity without competing for attention.
   */
  cover1: ['#5E7A6E', '#3A5249'],
  cover2: ['#7E7263', '#544A3E'],
  cover3: ['#6E6A84', '#464360'],
  cover4: ['#5D7480', '#384B55'],
  cover5: ['#80666C', '#554043'],
  cover6: ['#647084', '#3E4857'],
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
 * tighter (10), containers a little softer (14), and the full pill is reserved
 * for things that are genuinely pill-shaped — filter chips, badges, avatars.
 */
export const radii = {
  none: 0,
  xs: 4,
  /** Inline marks: badges on a dense row, tags, small swatches. */
  sm: 8,
  /** Controls: buttons, inputs, segmented controls. */
  md: 10,
  /** Containers: cards, sheets, tiles. */
  lg: 14,
  xl: 20,
  '2xl': 26,
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
export const shadows = {
  none: {},
  /** Barely there. A card that should feel attached to the page. */
  xs: {
    shadowColor: palette.ink,
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  /** A card that has lifted — pressed, dragged, or selected. */
  sm: {
    shadowColor: palette.ink,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  /** Menus, popovers, sticky footers. */
  md: {
    shadowColor: palette.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  /** Modals and sheets only. */
  lg: {
    shadowColor: palette.ink,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
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
} as const;

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
  layout,
} as const;
