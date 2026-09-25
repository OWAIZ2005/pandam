import { useReducedMotion } from 'react-native-reanimated';

/**
 * True when decorative motion is allowed. Every component in `motion/` gates
 * on this: under the OS "reduce motion" setting, depth and float collapse to a
 * static, still-premium resting state rather than animating.
 */
export function useMotionOK(): boolean {
  return !useReducedMotion();
}
