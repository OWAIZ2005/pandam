import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { colors, radii } from '../tokens';

export interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'plain' | 'filled';
  size?: number;
  disabled?: boolean;
}

/** A square tap target wrapping any icon node. Meets the 44dp minimum. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 44,
  disabled,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: variant === 'filled' ? colors.surfaceMuted : 'transparent',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      {icon}
    </Pressable>
  );
}
