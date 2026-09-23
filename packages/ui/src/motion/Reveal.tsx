import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { timings } from '../tokens';

import { useMotionOK } from './useMotionOK';

export interface RevealProps {
  children: ReactNode;
  /** Position in a staggered list; each step adds `step` ms of delay. */
  index?: number;
  step?: number;
  /** Rise distance in dp. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The shared entrance: fade + short rise, staggered by index. Capped so a long
 * list never makes the user wait for row twenty. Instant under reduced motion.
 */
export function Reveal({ children, index = 0, step = 45, offset = 10, style }: RevealProps) {
  const motionOK = useMotionOK();
  const p = useSharedValue(motionOK ? 0 : 1);

  useEffect(() => {
    if (!motionOK) {
      p.value = 1;
      return;
    }
    p.value = withDelay(
      Math.min(index, 8) * step,
      withTiming(1, { duration: timings.slow + 80, easing: Easing.out(Easing.cubic) }),
    );
  }, [motionOK, index, step, p]);

  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * offset }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
