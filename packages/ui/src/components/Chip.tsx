import { useState } from 'react';
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
  const [pressed, setPressed] = useState(false);
  // Plain array `style` (never a function) — NativeWind's native jsx runtime
  // drops function-form `style` props.
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={6}
      style={[
        {
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        pressed && { opacity: 0.8 },
      ]}
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
