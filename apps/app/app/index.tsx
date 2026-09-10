import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@pandam/ui';

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text variant="heading">PANDAM</Text>
        <Text variant="muted">Technical foundation ready.</Text>
      </View>
    </SafeAreaView>
  );
}
