import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import {
  Avatar,
  Notice,
  Press,
  Rail,
  Row,
  Screen,
  Section,
  SkeletonList,
  Stack,
  Text,
  colors,
  layout,
  radii,
  shadows,
  spacing,
} from '@pandam/ui';

import { AddCategorySheet } from '@/components/AddCategorySheet';
import { IntentSwitch } from '@/components/brand/IntentSwitch';
import { PandamBackground } from '@/components/brand/PandamBackground';
import { CategoryGrid } from '@/components/CategoryFilter';
import { ItemCard } from '@/components/ItemCard';
import { MatchCard } from '@/components/MatchCard';
import { ErrorState } from '@/components/states';
import {
  demoMatches,
  demoMyListings,
  demoMyNeeds,
  demoOthersListings,
  demoPages,
  demoQuery,
} from '@/dummy';
import { mediaSrc } from '@/lib/api/media';
import { useSession } from '@/lib/auth/hooks';
import { useBrowseCategories } from '@/lib/hooks/useCategories';
import { useDiscover, useMyItems } from '@/lib/hooks/useMarket';
import { useMatches } from '@/lib/hooks/useMatches';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* -------------------------------------------------------------------------- */

/** Compact match counter, sits on the surface strip under the action tiles. */
function StatChip({
  value,
  label,
  tone,
  onPress,
}: {
  value: number;
  label: string;
  tone: 'accent' | 'need' | 'match';
  onPress: () => void;
}) {
  return (
    <Press
      scale="sm"
      dim={false}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, gap: 1 }}
      states={{ hover: { backgroundColor: colors.surfaceHover } }}
    >
      <Text variant="numericLarge" numeric tone={value === 0 ? 'faint' : tone} style={{ fontWeight: '800' }}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </Press>
  );
}

/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const { profile } = useSession();
  const name = profile?.displayName?.split(' ')[0] ?? 'there';

  const categories = useBrowseCategories();
  const [addingCategory, setAddingCategory] = useState(false);
  const matches = demoQuery(useMatches(), demoMatches);
  const recent = demoQuery(useDiscover('listing', { limit: 8 }), demoPages(demoOthersListings));
  const myHave = demoQuery(useMyItems('listing'), demoMyListings);
  const myNeed = demoQuery(useMyItems('need'), demoMyNeeds);

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
  const matchCount = matches.data?.length ?? 0;
  const hasNothingListed = activeHave === 0 && activeNeed === 0;

  return (
    <Screen
      backdrop={<PandamBackground variant="glow" />}
      scroll
      padded={false}
      contentStyle={{ maxWidth: '100%' }}
      edges={['top']}
      tabBarInset
      onRefresh={() =>
        void Promise.all([matches.refetch(), recent.refetch(), myHave.refetch(), myNeed.refetch()])
      }
      refreshing={matches.isRefetching}
    >
      <View
        style={{
          width: '100%',
          maxWidth: wide ? 1080 : layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing.md,
        }}
      >
        <Stack gap="xl">
          {/* --------------------------------------------------- greeting -- */}
          <Row justify="space-between" align="center" gap={spacing.md}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="label" tone="muted">
                {greeting()},
              </Text>
              <Text variant="hero" numberOfLines={1}>
                {name}
              </Text>
            </View>

            <Press
              scale="sm"
              accessibilityRole="button"
              accessibilityLabel="Your profile"
              onPress={() => router.push('/(app)/(tabs)/profile')}
              style={{ borderRadius: radii.pill }}
            >
              <Avatar name={profile?.displayName ?? 'You'} size={46} uri={mediaSrc(profile?.avatarUrl)} />
            </Press>
          </Row>

          {/* ----------------------------------------------------- search -- */}
          <Press
            scale="sm"
            accessibilityRole="button"
            accessibilityLabel="Search what people are offering"
            onPress={() => goDiscover()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radii.md,
              paddingHorizontal: spacing.lg,
              height: 52,
              ...shadows.xs,
            }}
            states={{
              hover: { borderColor: colors.accentBorder },
              pressed: { backgroundColor: colors.surfaceHover },
            }}
          >
            <Ionicons name="search" size={19} color={colors.accent} />
            <Text tone="muted" style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>
              Search cameras, skills, furniture…
            </Text>
            <Ionicons name="options-outline" size={18} color={colors.textMuted} />
          </Press>

          {/* ------------------------------------------- I HAVE / I NEED -- */}
          <IntentSwitch
            haveCount={activeHave}
            needCount={activeNeed}
            onHave={() => router.push('/(app)/new-listing')}
            onNeed={() => router.push('/(app)/new-need')}
          />

          {/* --------------------------------------------------- matches -- */}
          <Press
            scale="sm"
            accessibilityRole="button"
            accessibilityLabel={`${matchCount} matches`}
            onPress={() => router.push('/(app)/(tabs)/matches')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.matchSoft,
              borderWidth: 1,
              borderColor: colors.matchBorder,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
            states={{ hover: { borderColor: colors.match } }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: colors.match,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="git-compare" size={20} color={colors.textInverse} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" tone="match" style={{ fontWeight: '800' }}>
                {matchCount > 0 ? `${matchCount} barter match${matchCount === 1 ? '' : 'es'}` : 'No matches yet'}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {matchCount > 0 ? 'Someone wants what you have' : 'List items to find your mirror'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.matchText} />
          </Press>
        </Stack>
      </View>

      {/* -------------------------------------------------------- sections -- */}
      <View
        style={{
          width: '100%',
          maxWidth: wide ? 1080 : layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing['2xl'],
        }}
      >
        <Stack gap="2xl">
          {/* ------------------------------------------------- categories -- */}
          {categories.data && categories.data.length > 0 ? (
            <Section title="Browse by category" actionLabel="All" onAction={() => goDiscover()}>
              <CategoryGrid
                categories={categories.data}
                limit={8}
                onSelect={(id) => goDiscover(id)}
                onAdd={() => setAddingCategory(true)}
              />
            </Section>
          ) : null}

          {/* ---------------------------------------------------- matches -- */}
          {matchCount > 0 ? (
            <Section
              eyebrow="Reciprocal"
              title="Your barter matches"
              actionLabel="See all"
              onAction={() => router.push('/(app)/(tabs)/matches')}
            >
              {matches.isPending ? (
                <SkeletonList count={1} />
              ) : matches.isError ? (
                <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
              ) : (
                <Stack gap="md">
                  {matches.data!.slice(0, 2).map((m) => (
                    <MatchCard key={m.key} match={m} onPress={() => router.push('/(app)/(tabs)/matches')} />
                  ))}
                </Stack>
              )}
            </Section>
          ) : null}

          {/* ----------------------------------------------------- recent -- */}
          <Section
            title="Fresh near you"
            subtitle="Just listed by other members"
            actionLabel="See all"
            onAction={() => goDiscover()}
          >
            {recent.isPending ? (
              <SkeletonList count={2} />
            ) : recent.isError ? (
              <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
            ) : recentItems.length === 0 ? (
              <Notice
                kind="neutral"
                icon={<Ionicons name="cube-outline" size={16} color={colors.textMuted} />}
              >
                Nothing has been published yet. Be the first to list something you have.
              </Notice>
            ) : (
              <Rail>
                {recentItems.slice(0, 8).map((it) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    variant="rail"
                    onPress={() => router.push(`/(app)/listing/${it.id}`)}
                  />
                ))}
              </Rail>
            )}
          </Section>

          {/* --------------------------------------------- match counters -- */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.lg,
              overflow: 'hidden',
            }}
          >
            <StatChip value={activeHave} label="listed" tone="accent" onPress={() => router.push('/(app)/(tabs)/profile')} />
            <View style={{ width: 1, backgroundColor: colors.borderSoft }} />
            <StatChip value={activeNeed} label="wanted" tone="need" onPress={() => router.push('/(app)/(tabs)/profile')} />
            <View style={{ width: 1, backgroundColor: colors.borderSoft }} />
            <StatChip value={matchCount} label="matches" tone="match" onPress={() => router.push('/(app)/(tabs)/matches')} />
          </View>

          {/* ----------------------------------------------- how it works -- */}
          {hasNothingListed ? (
            <View
              style={{
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.sm,
              }}
            >
              <Text variant="label" tone="secondary" style={{ fontWeight: '700' }}>
                How barter works here
              </Text>
              <Text variant="bodySm" tone="secondary">
                You have{' '}
                <Text variant="bodySm" tone="accent" style={{ fontWeight: '700' }}>
                  web design
                </Text>{' '}
                and need{' '}
                <Text variant="bodySm" tone="need" style={{ fontWeight: '700' }}>
                  photography
                </Text>
                . Someone else has photography and needs web design. PANDAM spots the mirror — no money
                changes hands.
              </Text>
            </View>
          ) : null}
        </Stack>
      </View>
      <AddCategorySheet
        visible={addingCategory}
        onClose={() => setAddingCategory(false)}
        existing={categories.data ?? []}
        onCreated={(c) => goDiscover(c.id)}
        onUseExisting={(id) => goDiscover(id)}
      />
    </Screen>
  );
}
