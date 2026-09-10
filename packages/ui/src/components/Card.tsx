import { type ReactNode, useState } from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '../tokens';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  padded?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Rounded surface with a hairline border and an optional soft shadow. */
export function Card({
  children,
  onPress,
  elevated = false,
  padded = true,
  accessibilityLabel,
  style,
}: CardProps) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    padded && { padding: spacing.lg },
    elevated ? shadows.sm : null,
    style,
  ];
  const [pressed, setPressed] = useState(false);
  if (!onPress) return <View style={base}>{children}</View>;
  // Plain array `style` (never a function) — NativeWind's native jsx runtime
  // drops function-form `style` props, which would strip the card's styling.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[base, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
