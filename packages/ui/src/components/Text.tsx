import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, fontSize } from '../tokens';

type Variant = 'body' | 'muted' | 'title' | 'heading';

export interface TextProps extends RNTextProps {
  variant?: Variant;
}

const VARIANT_STYLE: Record<
  Variant,
  { color: string; fontSize: number; fontWeight: '400' | '600' | '700' }
> = {
  body: { color: colors.text, fontSize: fontSize.base, fontWeight: '400' },
  muted: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '400' },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '600' },
  heading: { color: colors.text, fontSize: fontSize['2xl'], fontWeight: '700' },
};

/** Themed Text primitive. The first shared cross-platform component. */
export function Text({ variant = 'body', style, ...rest }: TextProps) {
  return <RNText style={[VARIANT_STYLE[variant], style]} {...rest} />;
}
