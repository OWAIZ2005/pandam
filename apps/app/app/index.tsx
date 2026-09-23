import { Redirect } from 'expo-router';

import { Splash, useHoldSplash } from '@/components/Splash';
import { useSession } from '@/lib/auth/hooks';

/** Entry gate: send the user to the right route group once auth is known. */
export default function Index() {
  const { isResolving, isAuthenticated } = useSession();
  const showSplash = useHoldSplash(isResolving);
  if (showSplash) return <Splash />;
  return <Redirect href={isAuthenticated ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
