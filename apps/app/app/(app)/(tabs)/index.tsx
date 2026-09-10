import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Card, Row, Screen, SkeletonList, Stack, Text, colors, radii, spacing } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ItemCard } from '@/components/ItemCard';
import { MatchCard } from '@/components/MatchCard';
import { ErrorState } from '@/components/states';
import { useSession } from '@/lib/auth/hooks';
import { useCategories } from '@/lib/hooks/useCategories';
import { useDiscover, useMyItems } from '@/lib/hooks/useMarket';
import { useMatches } from '@/lib/hooks/useMatches';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function QuickAction({
  tone,
  icon,
  label,
  onPress,
}: {
  tone: 'have' | 'need';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const bg = tone === 'have' ? colors.accent : colors.need;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: bg,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.sm,
        opacity: pressed ? 0.9 : 1,
        minHeight: 116,
        justifyContent: 'space-between',
      })}
    >
      <Ionicons name={icon} size={22} color={colors.textInverse} />
      <Text variant="bodyStrong" tone="inverse">
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
      <Text variant="h3">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text variant="label" tone="accent">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </Row>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const name = profile?.displayName?.split(' ')[0] ?? 'there';

  const categories = useCategories();
  const matches = useMatches();
  const recent = useDiscover('listing', { limit: 4 });
  const myHave = useMyItems('listing');
  const myNeed = useMyItems('need');

  const goDiscover = useCallback(
    (categoryId?: string) =>
      router.push(
        categoryId ? `/(app)/(tabs)/discover?category=${categoryId}` : '/(app)/(tabs)/discover',
      ),
    [router],
  );

  const recentItems = recent.data?.pages.flatMap((p) => p.items) ?? [];
  const activeHave = myHave.data?.filter((i) => i.status === 'published').length ?? 0;
  const activeNeed = myNeed.data?.filter((i) => i.status === 'published').length ?? 0;

  return (
    <Screen
      scroll
      onRefresh={() => void Promise.all([matches.refetch(), recent.refetch()])}
      refreshing={matches.isRefetching}
    >
      <AppHeader title="PANDAM" subtitle={`${greeting()}, ${name} — what can you trade today?`} />

      <Stack gap="2xl">
        <Row gap="md" align="stretch">
          <QuickAction
            tone="have"
            icon="cube-outline"
            label="Add something I have"
            onPress={() => router.push('/(app)/new-listing')}
          />
          <QuickAction
            tone="need"
            icon="search-outline"
            label="Add something I need"
            onPress={() => router.push('/(app)/new-need')}
          />
        </Row>

        <Row gap="md">
          <Card padded style={{ flex: 1 }}>
            <Text variant="display" tone="accent">
              {activeHave}
            </Text>
            <Text variant="bodySm" tone="secondary">
              active things you have
            </Text>
          </Card>
          <Card padded style={{ flex: 1 }}>
            <Text variant="display" tone="need">
              {activeNeed}
            </Text>
            <Text variant="bodySm" tone="secondary">
              active things you need
            </Text>
          </Card>
        </Row>

        <View>
          <SectionHeader
            title="Your barter matches"
            actionLabel="See all"
            onAction={() => router.push('/(app)/(tabs)/matches')}
          />
          {matches.isPending ? (
            <SkeletonList count={1} />
          ) : matches.isError ? (
            <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
          ) : (matches.data?.length ?? 0) === 0 ? (
            <Card padded>
              <Stack gap="sm">
                <Text variant="bodyStrong">No barter match yet</Text>
                <Text tone="secondary">
                  Add what you have and what you need — when someone’s the mirror of you, they show
                  up here.
                </Text>
                <Pressable onPress={() => goDiscover()} accessibilityRole="button" hitSlop={8}>
                  <Text variant="label" tone="accent">
                    Explore what others have →
                  </Text>
                </Pressable>
              </Stack>
            </Card>
          ) : (
            <Stack gap="md">
              {matches.data!.slice(0, 2).map((m) => (
                <MatchCard
                  key={m.key}
                  match={m}
                  onPress={() => router.push('/(app)/(tabs)/matches')}
                />
              ))}
            </Stack>
          )}
        </View>

        {categories.data && categories.data.length > 0 ? (
          <View>
            <SectionHeader title="Browse by category" />
            <CategoryFilter
              categories={categories.data}
              selectedId={null}
              onSelect={(id) => goDiscover(id ?? undefined)}
            />
          </View>
        ) : null}

        <View>
          <SectionHeader
            title="Recent on PANDAM"
            actionLabel="Discover"
            onAction={() => goDiscover()}
          />
          {recent.isPending ? (
            <SkeletonList count={2} />
          ) : recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
          ) : recentItems.length === 0 ? (
            <Card padded>
              <Text tone="secondary">
                Nothing published yet. Be the first — add something you have.
              </Text>
            </Card>
          ) : (
            <Stack gap="md">
              {recentItems.slice(0, 3).map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  onPress={() => router.push(`/(app)/listing/${it.id}`)}
                />
              ))}
            </Stack>
          )}
        </View>
      </Stack>
    </Screen>
  );
}
