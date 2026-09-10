import { useRouter } from 'expo-router';

import { Screen } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ItemForm } from '@/components/ItemForm';
import { useCreateItem } from '@/lib/hooks/useMarket';

export default function NewListingScreen() {
  const router = useRouter();
  const create = useCreateItem('listing');

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <AppHeader title="Add something I have" back />
      <ItemForm
        kind="listing"
        mode="create"
        submitting={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (res) => router.replace(`/(app)/listing/${res.item.id}`),
          })
        }
      />
    </Screen>
  );
}
