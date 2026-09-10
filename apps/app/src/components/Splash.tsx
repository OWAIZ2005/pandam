import { ActivityIndicator, View } from 'react-native';

import { Text, colors } from '@pandam/ui';

/** Neutral full-screen loader shown while auth state is resolving. */
export function Splash() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: colors.background,
      }}
    >
      <Text variant="display" tone="accent">
        PANDAM
      </Text>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
