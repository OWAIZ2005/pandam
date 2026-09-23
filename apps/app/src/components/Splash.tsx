import { View, useWindowDimensions } from 'react-native';

import { colors } from '@pandam/ui';

import { ProductComposition } from '@/components/brand/ProductComposition';
import { Wordmark } from '@/components/brand/Wordmark';

/**
 * Brand splash, shown while auth resolves.
 *
 * Entering PANDAM should feel like walking into a well-lit shop, not waiting
 * on a loader: the wordmark reveals at the centre (mark springs and turns,
 * letters open, tagline rises) while real marketplace objects drift in from
 * the corners at different depths and keep floating. Static under reduced
 * motion — the composition simply rests.
 */
export function Splash() {
  const { width, height } = useWindowDimensions();
  const h = Math.min(height, 760);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
      <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', height: h }}>
        <ProductComposition layout="scatter" height={h} exchange={false}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 6,
            }}
          >
            <Wordmark size={width < 500 ? 'lg' : 'xl'} tagline reveal align="center" />
          </View>
        </ProductComposition>
      </View>
    </View>
  );
}
