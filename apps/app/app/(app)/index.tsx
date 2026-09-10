import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@pandam/ui';

import { Button } from '@/components/form';
import { useLogout, useSession } from '@/lib/auth/hooks';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useSession();
  const logout = useLogout();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-3 p-6">
        <Text variant="heading">PANDAM</Text>
        <Text variant="body">Signed in as {profile?.displayName ?? user?.email ?? 'unknown'}.</Text>
        <Text variant="muted">
          Authentication foundation ready. The marketplace arrives in the next phase.
        </Text>

        <View className="mt-4 gap-2">
          <Button
            label="Edit profile"
            variant="ghost"
            onPress={() => router.push('/(app)/profile')}
          />
          <Button
            label={logout.isPending ? 'Signing out…' : 'Sign out'}
            disabled={logout.isPending}
            onPress={() =>
              logout.mutate(undefined, { onSettled: () => router.replace('/(auth)/login') })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
