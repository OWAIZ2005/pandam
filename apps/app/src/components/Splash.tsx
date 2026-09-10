import { ActivityIndicator, View } from 'react-native';

import { Text } from '@pandam/ui';

/** Neutral full-screen loader shown while auth state is resolving. */
export function Splash() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background">
      <Text variant="heading">PANDAM</Text>
      <ActivityIndicator />
    </View>
  );
}
