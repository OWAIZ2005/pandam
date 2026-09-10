import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text, colors } from '@pandam/ui';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <Text variant="h2">This screen doesn&apos;t exist.</Text>
        <Link href="/">
          <Text tone="accent" style={{ fontWeight: '600' }}>
            Go home
          </Text>
        </Link>
      </View>
    </>
  );
}
