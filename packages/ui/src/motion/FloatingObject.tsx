import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ambient } from '../tokens';

import { ALLOW_3D } from './allow3d';
import { useMotionOK } from './useMotionOK';

export interface FloatingObjectProps {
  children: ReactNode;
  /** Vertical travel in dp. */
  amplitude?: number;
  /** Peak rotation in degrees (Z), with a smaller Y rotation for depth. */
  rotate?: number;
  /** Stagger several floating objects so they never bob in unison. */
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Slow idle float + sway for a decorative object — the product "breathing" in
 * empty, loading and match states. Static under reduced motion.
 */
export function FloatingObject({
  children,
  amplitude = 7,
  rotate = 3,
  delay = 0,
  duration = ambient.float,
  style,
}: FloatingObjectProps) {
  const motionOK = useMotionOK();
  const t = useSharedValue(0);

  useEffect(() => {
    if (!motionOK) {
      t.value = 0;
      return undefined;
    }
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(t);
  }, [motionOK, delay, duration, t]);

  const animated = useAnimatedStyle(() => {
    const k = t.value * 2 - 1; // -1..1
    return {
      transform: [
        { perspective: 800 },
        { translateY: -amplitude * k },
        { rotateZ: `${rotate * k}deg` },
        { rotateY: `${ALLOW_3D ? rotate * 2 * k : 0}deg` },
      ],
    };
  });

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
