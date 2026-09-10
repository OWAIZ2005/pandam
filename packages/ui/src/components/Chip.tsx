import { Pressable } from 'react-native';

import { colors, radii, spacing } from '../tokens';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Selectable filter pill (categories, HAVE/NEED toggles). */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        variant="label"
        style={{ color: selected ? colors.accentStrong : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
