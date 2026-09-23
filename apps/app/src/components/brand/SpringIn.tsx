import { type ReactNode, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { useMotionOK } from '@pandam/ui';

/**
 * A photo "dropped" onto the page: it springs up from small with an
 * over-rotation, then settles at a slight resting tilt — alternating by index
 * so a row of prints looks hand-placed, not gridded.
 */
export function SpringIn({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const motionOK = useMotionOK();
  const p = useSharedValue(motionOK ? 0 : 1);
  const rest = index % 2 === 0 ? -2.5 : 2.5;

  useEffect(() => {
    if (motionOK)
      p.set(withDelay(Math.min(index, 5) * 60, withSpring(1, { damping: 9, stiffness: 150 })));
  }, [motionOK, index, p]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.get() * 2),
    transform: [{ scale: 0.4 + p.get() * 0.6 }, { rotate: `${rest + (1 - p.get()) * -16}deg` }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
