import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import {
  Button,
  Chip,
  EmptyState,
  Row,
  Screen,
  SearchInput,
  SkeletonList,
  Stack,
  colors,
  spacing,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ItemCard } from '@/components/ItemCard';
import { ErrorState } from '@/components/states';
import { type MarketKind } from '@/lib/api/market';
import { useCategories } from '@/lib/hooks/useCategories';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { useDiscover } from '@/lib/hooks/useMarket';

export default function DiscoverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [kind, setKind] = useState<MarketKind>('listing');
  const [rawQuery, setRawQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(params.category ?? null);
  const q = useDebounced(rawQuery.trim(), 350);

  const categories = useCategories();
  const filters = useMemo(
    () => ({ category: categoryId ?? undefined, q: q || undefined, limit: 12 }),
    [categoryId, q],
  );
  const discover = useDiscover(kind, filters);
  const items = discover.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
        <AppHeader title="Discover" />
        <Stack gap="md">
          <SearchInput
            icon={<Ionicons name="search" size={16} color={colors.textMuted} />}
            placeholder={
              kind === 'listing' ? 'Search things people have' : 'Search things people need'
            }
            value={rawQuery}
            onChangeText={setRawQuery}
            autoCapitalize="none"
          />
          <Row gap="sm">
            <Chip label="I HAVE" selected={kind === 'listing'} onPress={() => setKind('listing')} />
            <Chip label="I NEED" selected={kind === 'need'} onPress={() => setKind('need')} />
          </Row>
          {categories.data ? (
            <CategoryFilter
              categories={categories.data}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          ) : null}
        </Stack>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing['4xl'],
          gap: spacing.md,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() =>
              router.push(
                kind === 'listing' ? `/(app)/listing/${item.id}` : `/(app)/need/${item.id}`,
              )
            }
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (discover.hasNextPage && !discover.isFetchingNextPage) void discover.fetchNextPage();
        }}
        ListEmptyComponent={
          discover.isPending ? (
            <SkeletonList count={4} />
          ) : discover.isError ? (
            <ErrorState error={discover.error} onRetry={() => void discover.refetch()} />
          ) : (
            <EmptyState
              title={q || categoryId ? 'No results' : 'Nothing here yet'}
              body={
                q || categoryId
                  ? 'Try a different search or category.'
                  : `No one has published something they ${kind === 'listing' ? 'have' : 'need'} yet.`
              }
              actionLabel={q || categoryId ? 'Clear filters' : undefined}
              onAction={
                q || categoryId
                  ? () => {
                      setRawQuery('');
                      setCategoryId(null);
                    }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={
          discover.isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <SkeletonList count={1} />
            </View>
          ) : items.length > 0 && !discover.hasNextPage ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <Button
                label="You're all caught up"
                variant="ghost"
                size="sm"
                onPress={() => {}}
                disabled
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
