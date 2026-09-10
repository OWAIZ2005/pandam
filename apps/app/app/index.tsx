import { Redirect } from 'expo-router';

import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/auth/hooks';

/** Entry gate: send the user to the right route group once auth is known. */
export default function Index() {
  const { isResolving, isAuthenticated } = useSession();
  if (isResolving) return <Splash />;
  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />;
}
