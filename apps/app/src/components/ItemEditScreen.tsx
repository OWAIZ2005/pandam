import { useRouter } from 'expo-router';

import { Screen, SkeletonList } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ItemForm } from '@/components/ItemForm';
import { ErrorState } from '@/components/states';
import { type MarketKind } from '@/lib/api/market';
import { useItem, useSetItemStatus, useUpdateItem } from '@/lib/hooks/useMarket';

export function ItemEditScreen({ kind, id }: { kind: MarketKind; id: string }) {
  const router = useRouter();
  const item = useItem(kind, id);
  const update = useUpdateItem(kind);
  const setStatus = useSetItemStatus(kind);

  const back = () =>
    router.replace(kind === 'listing' ? `/(app)/listing/${id}` : `/(app)/need/${id}`);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <AppHeader title={kind === 'listing' ? 'Edit — I have' : 'Edit — I need'} back />
      {item.isPending ? (
        <SkeletonList count={2} />
      ) : item.isError ? (
        <ErrorState error={item.error} onRetry={() => void item.refetch()} />
      ) : !item.data ? null : (
        <ItemForm
          kind={kind}
          mode="edit"
          initial={item.data}
          submitting={update.isPending || setStatus.isPending}
          error={update.error ?? setStatus.error}
          onSubmit={(values) => {
            const publishChanged = values.status !== item.data!.status;
            update.mutate(
              {
                id,
                patch: {
                  categoryId: values.categoryId,
                  type: values.type,
                  title: values.title,
                  description: values.description,
                },
              },
              {
                onSuccess: () => {
                  if (publishChanged) {
                    setStatus.mutate({ id, status: values.status }, { onSettled: back });
                  } else {
                    back();
                  }
                },
              },
            );
          }}
        />
      )}
    </Screen>
  );
}
