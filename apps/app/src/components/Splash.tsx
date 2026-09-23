import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { Button, Text, colors, spacing } from '@pandam/ui';

import { ProductComposition } from '@/components/brand/ProductComposition';
import { Wordmark } from '@/components/brand/Wordmark';
import { authKeys } from '@/lib/auth/hooks';

/** How long the splash may wait on the first auth check before offering a way out. */
const TIMEOUT_MS = 12_000;

/**
 * Brand splash, shown while auth resolves.
 *
 * The wordmark reveals at the centre while real marketplace objects float in
 * the four corners. The corners are computed in pixels from the measured
 * screen (see the `scatter` layout in ProductComposition) and sized so no
 * object can reach the wordmark's band, on any phone aspect ratio.
 *
 * If the first `me` check has not resolved after TIMEOUT_MS (a dead network
 * path, an unreachable API) the splash turns into a quiet "couldn't reach
 * PANDAM" state with Retry, instead of spinning forever. Retry simply re-runs
 * the existing session query — the auth logic itself is untouched.
 */
export function Splash() {
  const { width, height } = useWindowDimensions();
  const qc = useQueryClient();
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [attempt]);

  const retry = () => {
    setTimedOut(false);
    setAttempt((a) => a + 1);
    void qc.refetchQueries({ queryKey: authKeys.me });
  };

  const h = Math.min(height, 760);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
      <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', height: h }}>
        <ProductComposition layout="scatter" height={h} exchange={false}>
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing.xl,
              zIndex: 6,
            }}
          >
            <Wordmark size={width < 500 ? 'lg' : 'xl'} tagline reveal align="center" />
            {timedOut ? (
              <View
                style={{
                  marginTop: spacing['2xl'],
                  alignItems: 'center',
                  gap: spacing.sm,
                  maxWidth: 300,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Ionicons name="cloud-offline-outline" size={16} color={colors.textSecondary} />
                  <Text variant="bodyStrong">Couldn’t reach PANDAM</Text>
                </View>
                <Text variant="bodySm" tone="secondary" center>
                  Check your connection, then try again. Nothing has been lost.
                </Text>
                <Button
                  label="Retry"
                  onPress={retry}
                  style={{ marginTop: spacing.sm, alignSelf: 'center' }}
                  leftIcon={<Ionicons name="refresh" size={16} color={colors.textInverse} />}
                />
              </View>
            ) : null}
          </View>
        </ProductComposition>
      </View>
    </View>
  );
}
