import { useRouter } from 'expo-router';

import { Screen } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ItemForm } from '@/components/ItemForm';
import { useCreateItem } from '@/lib/hooks/useMarket';

export default function NewNeedScreen() {
  const router = useRouter();
  const create = useCreateItem('need');

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <AppHeader title="Add something I need" back />
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
