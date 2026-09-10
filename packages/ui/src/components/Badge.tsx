import { View } from 'react-native';

import { colors, radii, spacing } from '../tokens';

import { Text } from './Text';

type Kind = 'have' | 'need' | 'neutral' | 'success' | 'warning' | 'danger';

const STYLE: Record<Kind, { bg: string; fg: string }> = {
  have: { bg: colors.accentSoft, fg: colors.accentStrong },
  need: { bg: colors.needSoft, fg: colors.needStrong },
  neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
  success: { bg: colors.accentSoft, fg: colors.accentStrong },
  warning: { bg: '#FBF0DD', fg: colors.warning },
  danger: { bg: '#FBE9E8', fg: colors.danger },
};

export interface BadgeProps {
  label: string;
  kind?: Kind;
}

/** Small pill for a status or a HAVE/NEED marker. */
export function Badge({ label, kind = 'neutral' }: BadgeProps) {
  const s = STYLE[kind];
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" style={{ color: s.fg, fontWeight: '700', letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
