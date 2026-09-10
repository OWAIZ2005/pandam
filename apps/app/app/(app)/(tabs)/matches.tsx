import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';

import { EmptyState, Screen, SkeletonList, Text, colors, spacing } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { MatchCard } from '@/components/MatchCard';
import { ErrorState } from '@/components/states';
import { useMatches } from '@/lib/hooks/useMatches';

export default function MatchesScreen() {
  const router = useRouter();
  const matches = useMatches();

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
        <AppHeader
          title="Matches"
          subtitle="Reciprocal barters — you have what they need, they have what you need."
        />
      </View>
      <FlatList
        data={matches.data ?? []}
        keyExtractor={(m) => m.key}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing['4xl'],
          gap: spacing.md,
          flexGrow: 1,
        }}
        refreshing={matches.isRefetching}
        onRefresh={() => void matches.refetch()}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => router.push(`/(app)/match/${encodeURIComponent(item.key)}`)}
          />
        )}
        ListEmptyComponent={
          matches.isPending ? (
            <SkeletonList count={3} />
          ) : matches.isError ? (
            <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
          ) : (
            <EmptyState
              title="We haven’t found a barter match yet"
              body="Add what you have and what you need. When someone is the mirror of you, they appear here — no money, just a fair swap."
              icon={<Ionicons name="sparkles-outline" size={40} color={colors.textMuted} />}
              actionLabel="Explore what others have"
              onAction={() => router.push('/(app)/(tabs)/discover')}
            />
          )
        }
        ListFooterComponent={
          (matches.data?.length ?? 0) > 0 ? (
            <Text
              variant="caption"
              tone="muted"
              style={{ textAlign: 'center', paddingTop: spacing.md }}
            >
              Matches are found by an exact, explainable rule — same category and kind on both
              sides.
            </Text>
          ) : null
        }
      />
    </Screen>
  );
}
