import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '../tokens';

type Tone =
  'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'need' | 'danger' | 'success';

const TONE_COLOR: Record<Tone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  inverse: colors.textInverse,
  accent: colors.accent,
  need: colors.need,
  danger: colors.danger,
  success: colors.success,
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: Tone;
}

/**
 * The typographic primitive. `variant` picks size/line-height/weight from the
 * type scale; `tone` picks a semantic colour. Everything else is a normal
 * `<Text>`.
 */
export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  return <RNText style={[typography[variant], { color: TONE_COLOR[tone] }, style]} {...rest} />;
}

/** Convenience wrappers so screens read well. */
export const Heading = ({ variant = 'h2', ...rest }: TextProps) => (
  <Text variant={variant} {...rest} />
);
