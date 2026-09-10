import { Redirect, Stack } from 'expo-router';

import { colors } from '@pandam/ui';

import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/auth/hooks';

/** Authenticated area. Guards every screen inside `(app)`. */
export default function AppLayout() {
  const { isResolving, isAuthenticated } = useSession();
  if (isResolving) return <Splash />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-listing" options={{ presentation: 'modal' }} />
      <Stack.Screen name="new-need" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
