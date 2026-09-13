import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen, SkeletonList, layout, spacing } from '@pandam/ui';

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
  const isHave = kind === 'listing';

  const back = () => router.replace(isHave ? `/(app)/listing/${id}` : `/(app)/need/${id}`);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.lg }}>
        <AppHeader title={isHave ? 'Edit what I have' : 'Edit what I need'} back />
      </View>

      {item.isPending ? (
        <View style={{ paddingHorizontal: layout.gutter }}>
          <SkeletonList count={2} />
        </View>
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
                  // Pricing only exists on listings, and the server clears the
                  // price itself when the type goes back to `barter` — so the
                  // patch sends the type and lets it resolve the pair.
                  ...(isHave
                    ? {
                        transactionType: values.transactionType,
                        ...(values.priceAmount === undefined
                          ? {}
                          : {
                              priceAmount: values.priceAmount,
                              priceCurrency: values.priceCurrency,
                            }),
                      }
                    : {}),
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
