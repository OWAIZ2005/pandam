import { type ReactNode, useCallback, useRef } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '../tokens';

import { useMotionOK } from './useMotionOK';

export interface TiltCardProps {
  children: ReactNode;
  /** Maximum rotation in degrees at the card's edge. Subtle by default. */
  maxTilt?: number;
  /** Perspective distance — lower is more dramatic. */
  perspective?: number;
  style?: StyleProp<ViewStyle>;
}

type PointerLike = { nativeEvent: { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number } };

/**
 * A 3D-ish wrapper: the card tilts toward the pointer (web hover) or finger
 * (touch), then springs back to flat. Pure Reanimated transforms — no WebGL —
 * so it is safe in Expo Go and on web.
 *
 * It only observes pointer/touch movement; it never claims the responder, so
 * any `Press`/`Button` inside keeps receiving its taps exactly as before.
 */
export function TiltCard({ children, maxTilt = 6, perspective = 900, style }: TiltCardProps) {
  const motionOK = useMotionOK();
  const size = useRef({ w: 1, h: 1 });
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 };
  }, []);

  const track = useCallback(
    (e: PointerLike | GestureResponderEvent) => {
      if (!motionOK) return;
      const n = e.nativeEvent as PointerLike['nativeEvent'];
      const x = n.locationX ?? n.offsetX ?? size.current.w / 2;
      const y = n.locationY ?? n.offsetY ?? size.current.h / 2;
      const px = Math.max(-1, Math.min(1, x / size.current.w - 0.5)) * 2;
      const py = Math.max(-1, Math.min(1, y / size.current.h - 0.5)) * 2;
      ry.value = withSpring(px * maxTilt, springs.tilt);
      rx.value = withSpring(-py * maxTilt, springs.tilt);
    },
    [motionOK, maxTilt, rx, ry],
  );

  const reset = useCallback(() => {
    rx.value = withSpring(0, springs.tilt);
    ry.value = withSpring(0, springs.tilt);
  }, [rx, ry]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ perspective }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }],
  }));

  return (
    <Animated.View
      onLayout={onLayout}
      // Pointer events cover web hover and modern RN touch; touch events are
      // the fallback for older native paths. None of these claim the responder.
      {...({
        onPointerMove: track,
        onPointerLeave: reset,
        onPointerUp: reset,
        onTouchMove: track,
        onTouchEnd: reset,
        onTouchCancel: reset,
      } as object)}
      style={[style, animated]}
    >
      {children}
    </Animated.View>
  );
}
