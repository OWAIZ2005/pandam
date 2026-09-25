import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useMotionOK } from '@pandam/ui';

/**
 * A soft, asymmetric pebble shape — purely decorative background texture that
 * gives compositions an organic, hand-placed feel. Never an eco symbol; just
 * a warm shape for objects to sit in front of. Drifts very slowly.
 */
export function OrganicShape({
  size,
  color,
  rotate = 0,
  drift = 8,
  style,
}: {
  size: number;
  color: string;
  rotate?: number;
  drift?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const motionOK = useMotionOK();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!motionOK) return undefined;
    t.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(t);
  }, [motionOK, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: (t.value - 0.5) * drift },
      { rotate: `${rotate + (t.value - 0.5) * 6}deg` },
      { scale: 1 + (t.value - 0.5) * 0.03 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size * 0.86,
          backgroundColor: color,
          borderTopLeftRadius: size * 0.62,
          borderTopRightRadius: size * 0.42,
          borderBottomRightRadius: size * 0.58,
          borderBottomLeftRadius: size * 0.38,
        },
        style,
        animated,
      ]}
    />
  );
}
