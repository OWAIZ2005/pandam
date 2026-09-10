import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@pandam/ui';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text variant="title">This screen doesn&apos;t exist.</Text>
        <Link href="/">
          <Text variant="muted">Go to home</Text>
        </Link>
      </View>
    </>
  );
}
