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
        border: c.border,
        'text-primary': c.textPrimary,
        'text-secondary': c.textSecondary,
        'text-muted': c.textMuted,
        'text-inverse': c.textInverse,
        accent: c.accent,
        'accent-strong': c.accentStrong,
        'accent-soft': c.accentSoft,
        need: c.need,
        'need-strong': c.needStrong,
        'need-soft': c.needSoft,
        success: c.success,
        warning: c.warning,
        danger: c.danger,
      },
      borderRadius: {
        sm: `${tokens.radii.sm}px`,
        md: `${tokens.radii.md}px`,
        lg: `${tokens.radii.lg}px`,
        xl: `${tokens.radii.xl}px`,
      },
    },
  },
  plugins: [],
};
