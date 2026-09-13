import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  Gradient,
  Row,
  Screen,
  SkeletonList,
  Stack,
  Text,
  colors,
  layout,
  radii,
  spacing,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ErrorState } from '@/components/states';
import { TYPE_LABEL } from '@/lib/format';
import { useMatches } from '@/lib/hooks/useMatches';
import { categoryIcon } from '@/lib/icons';

/** One direction of the trade, rendered as a card you can read in one glance. */
function TradeLeg({
  direction,
  personName,
  title,
  categoryName,
  categorySlug,
  type,
  mirrors,
  onPress,
}: {
  direction: 'give' | 'get';
  personName: string;
  title: string;
  categoryName: string;
  categorySlug: string;
  type: 'product' | 'service' | 'skill';
  mirrors: string;
  onPress: () => void;
}) {
  const give = direction === 'give';
  const tint = give ? colors.accent : colors.need;
  const soft = give ? colors.accentSoft : colors.needSoft;
  const strong = give ? colors.accentStrong : colors.needStrong;

  return (
    <Card padded elevated="xs" onPress={onPress}>
      <Stack gap="md">
        <Row justify="space-between">
          <Row gap="xs">
            <Ionicons
              name={give ? 'arrow-up-circle' : 'arrow-down-circle'}
              size={14}
              color={strong}
            />
            <Text variant="overline" caps style={{ color: strong }}>
              {give ? 'You give' : 'You get'}
            </Text>
          </Row>
          <Text variant="caption" tone="muted">
            {give ? `to ${personName}` : `from ${personName}`}
          </Text>
        </Row>

        <Row gap="md">
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radii.md,
              backgroundColor: soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={categoryIcon(categorySlug)} size={24} color={tint} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="h3" numberOfLines={2}>
              {title}
            </Text>
            <Text variant="caption" tone="muted">
              {categoryName} · {TYPE_LABEL[type]}
            </Text>
          </View>
        </Row>

        <Row
          gap="xs"
          style={{
            backgroundColor: colors.surfaceMuted,
            borderRadius: radii.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <Ionicons name="link" size={12} color={colors.textMuted} />
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
            {give ? 'Matches their need' : 'Matches your need'}: “{mirrors}”
          </Text>
        </Row>
      </Stack>
    </Card>
  );
}

export default function MatchDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const matches = useMatches();

  const match = matches.data?.find((m) => m.key === decodeURIComponent(key ?? ''));

  if (matches.isPending) {
    return (
      <Screen scroll>
        <AppHeader title="Barter match" back />
        <SkeletonList count={2} />
      </Screen>
    );
  }

  if (matches.isError) {
    return (
      <Screen scroll>
        <AppHeader title="Barter match" back />
        <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen scroll>
        <AppHeader title="Barter match" back />
        <Text tone="secondary">This match is no longer available.</Text>
      </Screen>
    );
  }

  const them = match.them.user.displayName;

  return (
    <Screen
      scroll
      padded={false}
      edges={[]}
      footer={
        <Stack gap="sm">
          <Button
            label="Make an offer"
            variant="match"
            size="lg"
            fullWidth
            disabled
            onPress={() => {}}
            leftIcon={<Ionicons name="paper-plane" size={17} color={colors.textInverse} />}
          />
          <Text variant="caption" tone="muted" center>
            Sending offers and chatting to arrange the trade arrives in the next phase.
          </Text>
        </Stack>
      }
    >
      {/* ------------------------------------------------------------ hero -- */}
      <Gradient
        token="match"
        direction="vertical"
        style={{
          paddingTop: spacing['4xl'],
          paddingHorizontal: layout.gutter,
          paddingBottom: spacing['3xl'],
        }}
      >
        <Row justify="space-between">
          <Row
            gap="xs"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: radii.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="sparkles" size={12} color={colors.textInverse} />
            <Text variant="caption" tone="inverse" style={{ fontWeight: '600' }}>
              Barter match
            </Text>
          </Row>
          <Text
            variant="label"
            tone="inverse"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/matches')
            }
          >
            Close
          </Text>
        </Row>

        {/*
          Two overlapping avatars rather than a row of three elements: the
          overlap is the picture of the match itself — two people meeting —
          and it leaves the full width for the names.
        */}
        <Row gap="md" align="center" style={{ marginTop: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name="You" size={46} ring />
            <View style={{ marginLeft: -14 }}>
              <Avatar name={them} size={46} ring />
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h2" tone="inverse" numberOfLines={1}>
              You and {them}
            </Text>
            <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.78)' }}>
              An even, two-way trade
            </Text>
          </View>
        </Row>
      </Gradient>

      {/* ------------------------------------------------------------ body -- */}
      <View style={{ paddingHorizontal: layout.gutter, paddingVertical: spacing['2xl'] }}>
        <Stack gap="lg">
          <Card tone="match" bordered padded>
            <Row gap="sm" align="flex-start">
              <Ionicons name="checkmark-circle" size={18} color={colors.match} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" tone="match">
                  Perfect reciprocal barter
                </Text>
                <Text variant="bodySm" tone="secondary">
                  You each have exactly what the other is looking for. No price, no payment — a
                  direct trade.
                </Text>
              </View>
            </Row>
          </Card>

          <TradeLeg
            direction="give"
            personName={them}
            title={match.you.have.title}
            categoryName={match.you.have.category.name}
            categorySlug={match.you.have.category.slug}
            type={match.you.have.type}
            mirrors={match.them.need.title}
            onPress={() => router.push(`/(app)/listing/${match.you.have.id}`)}
          />

          <Row gap="sm" align="center">
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.pill,
                backgroundColor: colors.matchSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="swap-vertical" size={17} color={colors.match} />
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </Row>

          <TradeLeg
            direction="get"
            personName={them}
            title={match.them.have.title}
            categoryName={match.them.have.category.name}
            categorySlug={match.them.have.category.slug}
            type={match.them.have.type}
            mirrors={match.you.need.title}
            onPress={() => router.push(`/(app)/listing/${match.them.have.id}`)}
          />

          <Button
            label={`See more of what ${them} has`}
            variant="ghost"
            fullWidth
            onPress={() =>
              router.push(`/(app)/(tabs)/discover?category=${match.them.have.category.id}`)
            }
          />
        </Stack>
      </View>
    </Screen>
  );
}
