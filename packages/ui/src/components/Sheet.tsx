import { type ReactNode, useEffect } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useMotionOK } from '../motion/useMotionOK';
import { colors, radii, shadows, spacing } from '../tokens';

import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Device bottom inset (safe area) — passed in so this package stays dependency-free. */
  bottomInset?: number;
}

/**
 * Bottom sheet: scrim + a surface that springs up from the bottom edge, with a
 * grab handle, a title and a 44pt close target. Keyboard-aware on iOS, capped
 * at 520 wide so it reads as a sheet (not a banner) on web/tablet. Tapping the
 * scrim or the hardware back button closes it.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  bottomInset = 0,
}: SheetProps) {
  const motionOK = useMotionOK();
  const y = useSharedValue(visible ? 0 : 1);

  useEffect(() => {
    if (!visible) return;
    y.set(1);
    y.set(
      motionOK ? withSpring(0, { damping: 22, stiffness: 240 }) : withTiming(0, { duration: 0 }),
    );
  }, [visible, motionOK, y]);

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() * 420 }] }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              width: '100%',
              maxWidth: 520,
              alignSelf: 'center',
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.sm,
              paddingBottom: Math.max(bottomInset, spacing.lg) + spacing.sm,
              ...shadows.lg,
            },
            sheet,
          ]}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: spacing.md,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h2">{title}</Text>
              {subtitle ? (
                <Text variant="bodySm" tone="secondary">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18, lineHeight: 20, color: colors.textSecondary }}>✕</Text>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
