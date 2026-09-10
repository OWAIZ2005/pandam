const { tokens } = require('@pandam/ui/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        'primary-fg': tokens.colors.primaryFg,
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        border: tokens.colors.border,
        text: tokens.colors.text,
        'text-muted': tokens.colors.textMuted,
        danger: tokens.colors.danger,
        success: tokens.colors.success,
      },
      borderRadius: {
        sm: `${tokens.radii.sm}px`,
        md: `${tokens.radii.md}px`,
        lg: `${tokens.radii.lg}px`,
      },
    },
  },
  plugins: [],
};
