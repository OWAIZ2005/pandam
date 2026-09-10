import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { type ReciprocalMatchView } from '@pandam/types';
import { Avatar, Badge, Card, Row, Stack, Text, colors, radii, spacing } from '@pandam/ui';

function Cell({ label, value, tone }: { label: string; value: string; tone: 'have' | 'need' }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tone === 'have' ? colors.accentSoft : colors.needSoft,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.xxs,
        minWidth: 0,
      }}
    >
      <Text
        variant="caption"
        style={{
          color: tone === 'have' ? colors.accentStrong : colors.needStrong,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
      <Text variant="bodySm" numberOfLines={2} style={{ fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

export interface MatchCardProps {
  match: ReciprocalMatchView;
  onPress?: () => void;
}

/**
 * Makes the reciprocal barter obvious: a 2×2 grid where each row is one item
 * the two sides swap. "You have X, they need X — they have Y, you need Y."
 */
export function MatchCard({ match, onPress }: MatchCardProps) {
  const them = match.them.user.displayName;
  return (
    <Card onPress={onPress} elevated accessibilityLabel={`Barter match with ${them}`}>
      <Stack gap="md">
        <Row justify="space-between">
          <Badge label="Barter match" kind="success" />
          <Row gap="xs">
            <Avatar name={them} size={22} />
            <Text variant="caption" tone="muted">
              with {them}
            </Text>
          </Row>
        </Row>

        <Row gap="sm" align="stretch">
          <Cell label="YOU HAVE" value={match.you.have.title} tone="have" />
          <View style={{ justifyContent: 'center' }}>
            <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
          </View>
          <Cell label="THEY NEED" value={match.them.need.title} tone="need" />
        </Row>
        <Row gap="sm" align="stretch">
          <Cell label="YOU NEED" value={match.you.need.title} tone="need" />
          <View style={{ justifyContent: 'center' }}>
            <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
          </View>
          <Cell label="THEY HAVE" value={match.them.have.title} tone="have" />
        </Row>

        <Text variant="caption" tone="muted">
          You each have what the other is looking for.
        </Text>
      </Stack>
    </Card>
  );
}
