import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { gradients, type GradientToken } from '../tokens';

export interface GradientProps {
  /** A named gradient from the token set, or an explicit two-stop pair. */
  token?: GradientToken;
  colors?: readonly [string, string];
  /** Diagonal by default; `vertical` for hero headers, `horizontal` for bars. */
  direction?: 'diagonal' | 'vertical' | 'horizontal';
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

const DIRECTION = {
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
} as const;

/**
 * Two-stop linear gradient.
 *
 * Wrapping `expo-linear-gradient` here means screens name a gradient from the
 * token set instead of hard-coding hex pairs. Note that the set is
 * deliberately small: gradient is reserved for the reciprocal-match moment,
 * the unauthenticated hero, a dark header, and the photo-less item cover. If
 * a new surface wants one, that is usually a sign it should be flat.
 */
export function Gradient({
  token = 'match',
  colors,
  direction = 'diagonal',
  children,
  style,
  pointerEvents,
}: GradientProps) {
  const pair = colors ?? gradients[token];
  const d = DIRECTION[direction];
  return (
    <LinearGradient
      colors={[pair[0], pair[1]]}
      start={d.start}
      end={d.end}
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </LinearGradient>
  );
}
