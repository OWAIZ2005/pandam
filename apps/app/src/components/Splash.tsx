import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { FloatingObject, Gradient, Text, colors, radii, shadows, spacing } from '@pandam/ui';

/**
 * Full-screen brand loader shown while auth state is resolving.
 *
 * This is the one screen that is allowed to be purely brand — it exists for
 * the second before the app knows who you are. It stays quiet about it: the
 * wordmark, one line, and a pulse. The pulse is a LOADING indicator, so it is
 * the thing that animates; everything else simply fades in once.
 */
export function Splash() {
  // Lazy state, not a ref: reading `ref.current` during render is what the
  // react-hooks/refs rule forbids, and these values are read while rendering.
  const [enter] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  return (
    <Gradient token="hero" direction="vertical" style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
        <Animated.View
          style={{
            opacity: enter,
            transform: [
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
            ],
            alignItems: 'center',
            gap: spacing.lg,
          }}
        >
          <FloatingObject amplitude={6} rotate={5}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: radii.xl,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.lg,
              }}
            >
              <Ionicons name="swap-horizontal" size={34} color={colors.accent} />
            </View>
          </FloatingObject>

          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text variant="display" tone="inverse">
              Pandam
            </Text>
            <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Trade what you have for what you need
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: radii.pill,
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}
            />
          ))}
        </Animated.View>
      </View>
    </Gradient>
  );
}
