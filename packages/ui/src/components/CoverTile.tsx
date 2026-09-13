import { type ReactNode, useState } from 'react';
import { Image, type StyleProp, View, type ViewStyle } from 'react-native';

import { coverFor, radii } from '../tokens';

import { Gradient } from './Gradient';

export interface CoverTileProps {
  /** Stable string (item id, category id, name) that picks the gradient. */
  seed: string;
  /** Usually an icon; rendered large and translucent as a watermark. */
  icon?: ReactNode;
  height?: number;
  radius?: keyof typeof radii;
  /**
   * The item's photo. When present it replaces the gradient; the gradient is
   * still what renders while it loads, if it fails, or if there is no photo.
   */
  uri?: string | null;
  /** Content drawn on top of the gradient (badges, titles). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * An item's cover: its photo when it has one, otherwise a gradient keyed to
 * the item's id with the category icon watermarked into it.
 *
 * The fallback is not a placeholder to be replaced later — most barter
 * listings are put up in a hurry without a photo, and an empty grey box would
 * make a whole wall of them look broken. The gradient stays underneath the
 * photo too, so a slow or failed image load degrades into something
 * deliberate rather than a hole.
 */
export function CoverTile({
  seed,
  icon,
  height = 132,
  radius = 'lg',
  uri,
  children,
  style,
}: CoverTileProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && !failed;

  return (
    <Gradient
      colors={coverFor(seed)}
      style={[{ height, borderRadius: radii[radius], overflow: 'hidden' }, style]}
    >
      {showPhoto ? (
        <>
          <Image
            source={{ uri }}
            style={{ position: 'absolute', inset: 0 }}
            resizeMode="cover"
            onError={() => setFailed(true)}
            accessibilityIgnoresInvertColors
          />
          {/*
            A scrim so white badges and titles stay legible on a bright photo.
            It is stronger at the top and bottom where the overlays actually
            sit, and clears in the middle so the photograph is still the thing
            you look at — a flat wash over the whole image mutes a good photo
            for the sake of two small labels.
          */}
          <Gradient
            colors={['rgba(18,22,25,0.42)', 'rgba(18,22,25,0)']}
            direction="vertical"
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72 }}
          />
          <Gradient
            colors={['rgba(18,22,25,0)', 'rgba(18,22,25,0.46)']}
            direction="vertical"
            pointerEvents="none"
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 96 }}
          />
        </>
      ) : null}
      {icon && !showPhoto ? (
        <View
          style={{
            position: 'absolute',
            right: -12,
            bottom: -14,
            opacity: 0.28,
            transform: [{ rotate: '-12deg' }],
          }}
        >
          {icon}
        </View>
      ) : null}
      {children}
    </Gradient>
  );
}
