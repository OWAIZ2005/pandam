import { type ReactNode, useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, timings } from '../tokens';

/** What the caller can paint differently per interaction state. */
export interface PressStateStyles {
  /** Pointer is over the element. Web only — touch devices never hover. */
  hover?: StyleProp<ViewStyle>;
  /** Finger or mouse is down. */
  pressed?: StyleProp<ViewStyle>;
  /** Element has keyboard focus. */
  focused?: StyleProp<ViewStyle>;
}

export interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  /**
   * How far the element dips on press. Small by default: a deep dip reads as
   * a toy, and on web it forces a repaint of the text inside.
   */
  scale?: 'sm' | 'md' | 'lg' | 'none';
  /** Dim slightly on press, in addition to the scale. */
  dim?: boolean;
  /**
   * Skip the default focus ring — only for a control that draws its own
   * (a segmented control painting its selected pill, say).
   */
  noFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Per-state overrides, so components describe their own feedback. */
  states?: PressStateStyles;
}

/**
 * Press dips. Tuned down from the original values: 0.98 is felt rather than
 * seen, which is the point — the feedback should register as the surface
 * responding, not as an animation playing.
 */
const SCALE = { sm: 0.985, md: 0.975, lg: 0.955, none: 1 } as const;

/**
 * The tappable wrapper behind every interactive surface in the product.
 *
 * It exists to make the four states a real control has — rest, hover, press,
 * focus — available everywhere from one place, rather than each component
 * inventing its own. Hover is web-only and focus is keyboard-only, so on a
 * phone this is just a press dip.
 *
 * Implementation notes, all learned the hard way:
 * - A plain `Pressable` carries both the touch handling and the caller's
 *   style, so layout (`flex`, width, margins) behaves exactly as written.
 * - `Animated.createAnimatedComponent(Pressable)` swallows `onPress` on React
 *   Native Web — every button silently stopped working. State-driven
 *   transforms are the portable way to do this.
 * - `style` is always a plain array, never a function: NativeWind's native jsx
 *   runtime drops function-form `style` props, which strips the visuals.
 * - The focus ring uses CSS `outline` (web) rather than a border, so it never
 *   participates in layout and cannot shift the element by a pixel.
 */
export function Press({
  children,
  scale = 'md',
  dim = true,
  noFocusRing = false,
  style,
  states,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  onFocus,
  onBlur,
  disabled,
  ...rest
}: PressProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      setPressed(true);
      onPressIn?.(e);
    },
    [onPressIn],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      setPressed(false);
      onPressOut?.(e);
    },
    [onPressOut],
  );

  const handleHoverIn = useCallback<NonNullable<PressableProps['onHoverIn']>>(
    (e) => {
      setHovered(true);
      onHoverIn?.(e);
    },
    [onHoverIn],
  );

  const handleHoverOut = useCallback<NonNullable<PressableProps['onHoverOut']>>(
    (e) => {
      setHovered(false);
      onHoverOut?.(e);
      // A pointer leaving mid-press must clear the press state too, otherwise
      // the element stays dipped after the mouse has gone.
      setPressed(false);
    },
    [onHoverOut],
  );

  const handleFocus = useCallback<NonNullable<PressableProps['onFocus']>>(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback<NonNullable<PressableProps['onBlur']>>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const isPressed = pressed && !disabled;
  const isHovered = hovered && !disabled && !pressed;
  const isFocused = focused && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[
        // A short transition makes hover feel like a material response rather
        // than a flicker. Web-only: `transitionDuration` is a no-op natively.
        Platform.OS === 'web'
          ? ({
              transitionDuration: `${timings.fast}ms`,
              transitionProperty: 'background-color, border-color, opacity, transform, box-shadow',
            } as unknown as ViewStyle)
          : null,
        style,
        isHovered && states?.hover,
        isPressed && [
          { transform: [{ scale: SCALE[scale] }] },
          dim ? { opacity: 0.94 } : null,
          states?.pressed,
        ],
        isFocused && [
          !noFocusRing && Platform.OS === 'web'
            ? ({
                outlineStyle: 'solid',
                outlineWidth: 2,
                outlineColor: colors.focus,
                outlineOffset: 2,
              } as unknown as ViewStyle)
            : null,
          states?.focused,
        ],
      ]}
    >
      {children}
    </Pressable>
  );
}
