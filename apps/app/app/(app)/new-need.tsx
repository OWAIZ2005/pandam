import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen, layout, spacing } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ItemForm } from '@/components/ItemForm';
import { useCreateItem } from '@/lib/hooks/useMarket';

export default function NewNeedScreen() {
  const router = useRouter();
  const create = useCreateItem('need');

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.lg }}>
        <AppHeader
          title="Something I need"
          subtitle="We find people who have it and want what you offer."
          back
        />
      </View>

      <ItemForm
        kind="need"
        mode="create"
        submitting={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (res) => router.replace(`/(app)/need/${res.item.id}`),
          })
        }
      />
    </Screen>
  );
}
