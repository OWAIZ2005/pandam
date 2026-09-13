import { type ReactNode } from 'react';
import { ScrollView, type StyleProp, type ViewStyle } from 'react-native';

import { layout, spacing, type SpacingToken } from '../tokens';

export interface RailProps {
  children: ReactNode;
  gap?: SpacingToken;
  /** Bleed the rail to the screen edges so cards scroll out of the gutter. */
  bleed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Horizontal scroller for card rows. `bleed` cancels the page gutter with a
 * negative margin and restores it as padding, so the first card lines up with
 * the text above it while later cards run to the screen edge — the detail that
 * makes a carousel look native rather than boxed in.
 */
export function Rail({ children, gap = 'md', bleed = true, style }: RailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[bleed && { marginHorizontal: -layout.gutter }, style]}
      contentContainerStyle={{
        gap: spacing[gap],
        paddingHorizontal: bleed ? layout.gutter : 0,
      }}
    >
      {children}
    </ScrollView>
  );
}
