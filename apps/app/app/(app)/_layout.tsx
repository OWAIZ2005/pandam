import { Redirect, Stack } from 'expo-router';

import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/auth/hooks';

/** Authenticated area. Guards every screen inside `(app)`. */
export default function AppLayout() {
  const { isResolving, isAuthenticated } = useSession();
  if (isResolving) return <Splash />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
