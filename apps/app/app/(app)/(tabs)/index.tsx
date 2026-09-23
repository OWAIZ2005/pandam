import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import {
  Avatar,
  Card,
  CoverTile,
  Divider,
  FloatingObject,
  Notice,
  Press,
  Rail,
  Reveal,
  Row,
  Screen,
  Section,
  SkeletonList,
  Stack,
  Text,
  TiltCard,
  colors,
  layout,
  radii,
  shadows,
  spacing,
} from '@pandam/ui';

import { CategoryGrid } from '@/components/CategoryFilter';
import { ItemCard } from '@/components/ItemCard';
import { MatchCard } from '@/components/MatchCard';
import { ErrorState } from '@/components/states';
import {
  demoCategoryList,
  demoMatches,
  demoMyListings,
  demoMyNeeds,
  demoOthersListings,
  demoPages,
  demoQuery,
} from '@/dummy';
import { mediaSrc, primaryImage } from '@/lib/api/media';
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

/* -------------------------------------------------------------------------- */

/**
 * One of the two ways into the product: offer a thing, or ask for one.
 *
 * A rich, tactile card rather than a flat tile — this is the core concept of
 * Pandam, so it earns depth: a warm tinted surface, a small floating stack of
 * real item photos, and a gentle 3D tilt toward the pointer / finger. The
 * whole card is still one button doing exactly what it always did.
 */
function IntentCard({
  kind,
  label,
  hint,
  cta,
  photos,
  count,
  onPress,
}: {
  kind: 'have' | 'need';
  label: string;
  hint: string;
  cta: string;
  photos: string[];
  count: number;
  onPress: () => void;
}) {
  const isHave = kind === 'have';
  const bg = isHave ? colors.accent : colors.needSoft;
  const fg = isHave ? colors.textInverse : colors.needText;
  const sub = isHave ? 'rgba(255,253,249,0.78)' : colors.textSecondary;
  const icon: keyof typeof Ionicons.glyphMap = isHave ? 'cube-outline' : 'search-outline';

  return (
    <TiltCard style={{ flex: 1, minWidth: 0 }} maxTilt={5}>
      <Press
        scale="sm"
        lift
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          minHeight: 212,
          borderRadius: radii.xl,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: isHave ? colors.accentStrong : colors.needBorder,
          padding: spacing.lg,
          overflow: 'hidden',
          justifyContent: 'space-between',
          ...shadows.sm,
        }}
      >
        {/* Floating photo stack — real things, not an icon. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', right: -6, top: 14, width: 104, height: 110 }}
        >
          {photos.slice(0, 2).map((uri, i) => (
            <FloatingObject
              key={uri}
              delay={i * 700}
              amplitude={5}
              rotate={2}
              style={{
                position: 'absolute',
                right: i === 0 ? 22 : 0,
                top: i === 0 ? 0 : 30,
                transform: [{ rotate: i === 0 ? '-8deg' : '7deg' }],
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: radii.md,
                  borderWidth: 3,
                  borderColor: colors.surface,
                  backgroundColor: colors.surface,
                  overflow: 'hidden',
                  ...shadows.md,
                }}
              >
                <CoverTile seed={uri} uri={uri} height={58} radius="sm" />
              </View>
            </FloatingObject>
          ))}
          {photos.length === 0 ? (
            <FloatingObject style={{ position: 'absolute', right: 20, top: 8 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: radii.lg,
                  backgroundColor: isHave ? 'rgba(255,253,249,0.16)' : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={icon} size={28} color={isHave ? colors.textInverse : colors.need} />
              </View>
            </FloatingObject>
          ) : null}
        </View>

        <View style={{ gap: spacing.xs, maxWidth: '62%' }}>
          <Text variant="overline" style={{ color: sub }}>
            {isHave ? 'I HAVE' : 'I NEED'}
          </Text>
          <Text variant="numericLarge" numeric style={{ color: fg }}>
            {count}
          </Text>
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text variant="h2" style={{ color: fg }}>
            {label}
          </Text>
          <Text variant="caption" style={{ color: sub }} numberOfLines={2}>
            {hint}
          </Text>
          <Row gap="xs" style={{ marginTop: spacing.xs }}>
            <Text variant="label" style={{ color: fg, fontWeight: '600' }}>
              {cta}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={fg} />
          </Row>
        </View>
      </Press>
    </TiltCard>
  );
}

/**
 * One figure in the stat row.
 *
 * No icon and no coloured disc: the number IS the content, and a 34px circle
 * next to a single digit was drawing the eye away from it. Tabular figures
 * keep the three columns aligned as the counts change.
 */
function Stat({
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
      scale="none"
      dim={false}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radii.sm }}
      states={{ hover: { backgroundColor: colors.surfaceHover } }}
    >
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text variant="numericLarge" numeric tone={value === 0 ? 'faint' : tone}>
          {value}
        </Text>
        <Text variant="caption" tone="muted" center numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Press>
  );
}

/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const name = profile?.displayName?.split(' ')[0] ?? 'there';

  const categories = demoQuery(useCategories(), demoCategoryList as never);
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

  // Photos for the intent cards: your own things first, then the community's.
  const havePhotos = [...(myHave.data ?? []), ...recentItems]
    .map((i) => primaryImage(i.images))
    .filter((u): u is string => !!u);
  const needPhotos = recentItems
    .slice(2)
    .map((i) => primaryImage(i.images))
    .filter((u): u is string => !!u);

  return (
    <Screen
      scroll
      padded={false}
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
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing.lg,
        }}
      >
        <Stack gap="2xl">
          {/* --------------------------------------------------- greeting -- */}
          {/*
            No gradient banner here. The marketing hero belongs on the way IN
            to the product; once you are inside, a coloured slab across the top
            of every visit is just something to scroll past. The page starts
            with who you are and what you can do.
          */}
          <Row justify="space-between" align="center" gap="md">
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="label" tone="muted">
                {greeting()},
              </Text>
              <Text variant="display" numberOfLines={1}>
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
              <Avatar
                name={profile?.displayName ?? 'You'}
                size={44}
                uri={mediaSrc(profile?.avatarUrl)}
              />
            </Press>
          </Row>

          {/* ----------------------------------------------------- search -- */}
          {/*
            A real-looking field that opens Discover. It is a button, not an
            input, and is labelled as one for assistive tech — but it has to
            LOOK like the search box it leads to, or the tap feels like a
            detour instead of a continuation.
          */}
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
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.pill,
              paddingHorizontal: spacing.lg,
              height: 50,
              ...shadows.xs,
            }}
            states={{
              hover: { borderColor: colors.borderStrong },
              pressed: { backgroundColor: colors.surfaceHover },
            }}
          >
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <Text tone="muted" style={{ flex: 1 }} numberOfLines={1}>
              Search skills, products, services…
            </Text>
          </Press>

          {/* ------------------------------------------- I HAVE / I NEED -- */}
          <Reveal index={1}>
            <Row gap="md" align="stretch">
              <IntentCard
                kind="have"
                label="List what you have"
                hint="A product, a service or a skill"
                cta="Add a listing"
                count={activeHave}
                photos={havePhotos}
                onPress={() => router.push('/(app)/new-listing')}
              />
              <IntentCard
                kind="need"
                label="Ask for what you need"
                hint="We watch for someone who mirrors you"
                cta="Add a need"
                count={activeNeed}
                photos={needPhotos}
                onPress={() => router.push('/(app)/new-need')}
              />
            </Row>
          </Reveal>

          <Reveal index={2}>
            {/* ------------------------------------------------------ stats -- */}
            <Card padded={false} radius="xl">
              <Row style={{ paddingHorizontal: spacing.xs }}>
                <Stat
                  value={activeHave}
                  label="listed"
                  tone="accent"
                  onPress={() => router.push('/(app)/(tabs)/profile')}
                />
                <Divider
                  tone="soft"
                  style={{ width: 1, height: 'auto', marginVertical: spacing.md }}
                />
                <Stat
                  value={activeNeed}
                  label="needed"
                  tone="need"
                  onPress={() => router.push('/(app)/(tabs)/profile')}
                />
                <Divider
                  tone="soft"
                  style={{ width: 1, height: 'auto', marginVertical: spacing.md }}
                />
                <Stat
                  value={matchCount}
                  label="matches"
                  tone="match"
                  onPress={() => router.push('/(app)/(tabs)/matches')}
                />
              </Row>
            </Card>
          </Reveal>
        </Stack>
      </View>

      {/* -------------------------------------------------------- sections -- */}
      <View
        style={{
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing['3xl'],
        }}
      >
        <Stack gap="3xl">
          {/* ---------------------------------------------------- matches -- */}
          <Section
            eyebrow="Reciprocal"
            title="Your barter matches"
            actionLabel={matchCount > 0 ? 'See all' : undefined}
            onAction={matchCount > 0 ? () => router.push('/(app)/(tabs)/matches') : undefined}
          >
            {matches.isPending ? (
              <SkeletonList count={1} />
            ) : matches.isError ? (
              <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
            ) : matchCount === 0 ? (
              /*
               * The empty match state depends on WHY it is empty. With nothing
               * listed, matching cannot work yet and the fix is to list
               * something; with items listed, there is simply no mirror yet and
               * the useful next move is to go looking.
               */
              <Card tone="match" padded>
                <Stack gap="md">
                  <Row gap="sm">
                    <Ionicons name="sparkles" size={16} color={colors.match} />
                    <Text variant="bodyStrong" tone="match">
                      No match yet
                    </Text>
                  </Row>
                  <Text variant="bodySm" tone="secondary">
                    {hasNothingListed
                      ? 'Matching needs both halves: something you have, and something you need. Add one of each and we will watch for your mirror.'
                      : 'Nobody mirrors you yet — they would need to want what you have and have what you want. We will tell you the moment it happens.'}
                  </Text>
                  <Press
                    onPress={
                      hasNothingListed ? () => router.push('/(app)/new-need') : () => goDiscover()
                    }
                    scale="sm"
                    hitSlop={10}
                    accessibilityRole="button"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Row gap="xs">
                      <Text variant="label" tone="match">
                        {hasNothingListed ? 'Add what you need' : 'Browse what others have'}
                      </Text>
                      <Ionicons name="arrow-forward" size={13} color={colors.matchText} />
                    </Row>
                  </Press>
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
          </Section>

          {/* ------------------------------------------------- categories -- */}
          {categories.data && categories.data.length > 0 ? (
            <Section title="Browse by category" actionLabel="All" onAction={() => goDiscover()}>
              <CategoryGrid
                categories={categories.data}
                limit={8}
                onSelect={(id) => goDiscover(id)}
              />
            </Section>
          ) : null}

          {/* ----------------------------------------------------- recent -- */}
          <Section
            title="People are offering"
            subtitle="Freshly listed by other members"
            actionLabel="Discover"
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

          {/* ----------------------------------------------- how it works -- */}
          {/*
            Kept only while the user has nothing listed. Once someone is
            actually trading, an explanation of what barter is has stopped
            being help and become clutter on every visit.
          */}
          {hasNothingListed ? (
            <Card tone="muted" bordered padded>
              <Stack gap="sm">
                <Text variant="label" tone="secondary">
                  How barter works here
                </Text>
                <Text variant="bodySm" tone="secondary">
                  You have{' '}
                  <Text variant="bodySm" tone="accent" style={{ fontWeight: '600' }}>
                    web design
                  </Text>{' '}
                  and need{' '}
                  <Text variant="bodySm" tone="need" style={{ fontWeight: '600' }}>
                    photography
                  </Text>
                  . Someone else has photography and needs web design. PANDAM spots the mirror — no
                  money changes hands.
                </Text>
              </Stack>
            </Card>
          ) : null}
        </Stack>
      </View>
    </Screen>
  );
}
