import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, type typography } from '../tokens';

import { Text } from './Text';

type Variant = 'primary' | 'need' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const BG: Record<Variant, string> = {
  primary: colors.accent,
  need: colors.need,
  secondary: colors.surfaceMuted,
  ghost: 'transparent',
  danger: colors.danger,
};
const FG: Record<Variant, 'inverse' | 'primary' | 'accent'> = {
  primary: 'inverse',
  need: 'inverse',
  secondary: 'primary',
  ghost: 'accent',
  danger: 'inverse',
};
const PAD: Record<Size, { py: number; px: number; font: keyof typeof typography }> = {
  sm: { py: spacing.sm, px: spacing.md, font: 'label' },
  md: { py: spacing.md, px: spacing.lg, font: 'bodyStrong' },
  lg: { py: spacing.lg, px: spacing.xl, font: 'bodyStrong' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const pad = PAD[size];
  const isDisabled = disabled || loading;
  const [pressed, setPressed] = useState(false);

  // NOTE: `style` is a plain array, never a function. NativeWind's jsx runtime
  // drops function-form `style` props on native, which would strip every
  // visual here and make the button invisible.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        {
          backgroundColor: BG[variant],
          paddingVertical: pad.py,
          paddingHorizontal: pad.px,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'ghost' ? colors.accent : colors.textInverse
          }
        />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <Text variant={pad.font} tone={FG[variant]}>
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
