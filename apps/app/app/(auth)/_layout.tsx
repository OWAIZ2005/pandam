import { Redirect, Stack } from 'expo-router';

import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/auth/hooks';

/** Unauthenticated area. An already-signed-in user is bounced to the app. */
export default function AuthLayout() {
  const { isResolving, isAuthenticated } = useSession();
  if (isResolving) return <Splash />;
  if (isAuthenticated) return <Redirect href="/(app)/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
