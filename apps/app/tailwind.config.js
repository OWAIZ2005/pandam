const { tokens } = require('@pandam/ui/tokens');

const c = tokens.colors;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: c.background,
        surface: c.surface,
        'surface-muted': c.surfaceMuted,
        'surface-hover': c.surfaceHover,
        border: c.border,
        'border-soft': c.borderSoft,
        'border-strong': c.borderStrong,
        'text-primary': c.textPrimary,
        'text-secondary': c.textSecondary,
        'text-muted': c.textMuted,
        'text-faint': c.textFaint,
        'background-secondary': c.backgroundSecondary,
        'text-inverse': c.textInverse,
        accent: c.accent,
        'accent-strong': c.accentStrong,
        'accent-soft': c.accentSoft,
        'accent-text': c.accentText,
        need: c.need,
        'need-strong': c.needStrong,
        'need-soft': c.needSoft,
        'need-text': c.needText,
        match: c.match,
        'match-strong': c.matchStrong,
        'match-soft': c.matchSoft,
        'match-text': c.matchText,
        success: c.success,
        warning: c.warning,
        danger: c.danger,
      },
      // Mirrors the token scale exactly — controls at `md`, containers at
      // `lg`, so a NativeWind class and an imperative style agree.
      borderRadius: {
        sm: `${tokens.radii.sm}px`,
        md: `${tokens.radii.md}px`,
        lg: `${tokens.radii.lg}px`,
        xl: `${tokens.radii.xl}px`,
        '2xl': `${tokens.radii['2xl']}px`,
      },
    },
  },
  plugins: [],
};
