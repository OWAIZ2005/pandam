import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { type MatchSide } from '@pandam/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Row,
  Screen,
  SkeletonList,
  Stack,
  Text,
  colors,
  radii,
  spacing,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ErrorState } from '@/components/states';
import { TYPE_LABEL } from '@/lib/format';
import { useMatches } from '@/lib/hooks/useMatches';

function SidePanel({ heading, side }: { heading: string; side: MatchSide }) {
  return (
    <Card padded>
      <Stack gap="md">
        <Row gap="sm">
          <Avatar name={side.user.displayName} size={28} />
          <Text variant="h3">{heading}</Text>
        </Row>
        <View style={{ gap: spacing.xs }}>
          <Badge label="Has" kind="have" />
          <Text variant="bodyStrong">{side.have.title}</Text>
          <Text variant="caption" tone="muted">
            {side.have.category.name} · {TYPE_LABEL[side.have.type]}
          </Text>
        </View>
        <Divider />
        <View style={{ gap: spacing.xs }}>
          <Badge label="Needs" kind="need" />
          <Text variant="bodyStrong">{side.need.title}</Text>
          <Text variant="caption" tone="muted">
            {side.need.category.name} · {TYPE_LABEL[side.need.type]}
          </Text>
        </View>
      </Stack>
    </Card>
  );
}

export default function MatchDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const matches = useMatches();

  const match = matches.data?.find((m) => m.key === decodeURIComponent(key ?? ''));

  return (
    <Screen scroll>
      <AppHeader title="Barter match" back />
      {matches.isPending ? (
        <SkeletonList count={2} />
      ) : matches.isError ? (
        <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
      ) : !match ? (
        <Text tone="secondary">This match is no longer available.</Text>
      ) : (
        <Stack gap="lg">
          <View
            style={{
              backgroundColor: colors.accentSoft,
              borderRadius: radii.md,
              padding: spacing.lg,
              gap: spacing.xxs,
            }}
          >
            <Row gap="sm">
              <Ionicons name="checkmark-circle" size={18} color={colors.accentStrong} />
              <Text variant="bodyStrong" tone="accent">
                Perfect reciprocal barter
              </Text>
            </Row>
            <Text tone="secondary">
              You each have exactly what the other is looking for. No price, no payment — a direct
              trade.
            </Text>
          </View>

          <SidePanel heading="You" side={match.you} />
          <SidePanel heading={match.them.user.displayName} side={match.them} />

          <Stack gap="sm">
            <Button
              label="Make an offer"
              fullWidth
              disabled
              onPress={() => {}}
              leftIcon={
                <Ionicons name="paper-plane-outline" size={16} color={colors.textInverse} />
              }
            />
            <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              Sending offers and chatting to arrange the trade arrives in the next phase.
            </Text>
            <Button
              label="See more of what they have"
              variant="ghost"
              fullWidth
              onPress={() =>
                router.push(`/(app)/(tabs)/discover?category=${match.them.have.category.id}`)
              }
            />
          </Stack>
        </Stack>
      )}
    </Screen>
  );
}
