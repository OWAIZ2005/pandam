import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { type MarketItem } from '@pandam/types';
import { Avatar, Badge, Card, Row, Text, colors, spacing } from '@pandam/ui';

import { STATUS_LABEL, TYPE_LABEL, statusBadgeKind, timeAgo } from '@/lib/format';

export interface ItemCardProps {
  item: MarketItem;
  onPress?: () => void;
  /** Show the owner row (hidden on "my items" lists). */
  showOwner?: boolean;
  /** Show the publication-status badge (used on the profile / "mine" lists). */
  showStatus?: boolean;
}

/** A listing ("I HAVE") or need ("I NEED") card. The HAVE/NEED badge and the
 *  accent colour make the two kinds unmistakable at a glance. */
export function ItemCard({ item, onPress, showOwner = true, showStatus = false }: ItemCardProps) {
  const isHave = item.kind === 'listing';
  return (
    <Card
      onPress={onPress}
      elevated
      accessibilityLabel={`${isHave ? 'Have' : 'Need'}: ${item.title}`}
    >
      <View style={{ gap: spacing.sm }}>
        <Row justify="space-between">
          <Row gap="xs">
            <Badge label={isHave ? 'I have' : 'I need'} kind={isHave ? 'have' : 'need'} />
            {showStatus ? (
              <Badge label={STATUS_LABEL[item.status]} kind={statusBadgeKind(item.status)} />
            ) : null}
          </Row>
          <Text variant="caption" tone="muted">
            {timeAgo(item.createdAt)}
          </Text>
        </Row>

        <Text variant="h3" numberOfLines={2}>
          {item.title}
        </Text>
        <Text tone="secondary" numberOfLines={2}>
          {item.description}
        </Text>

        <Row gap="sm" style={{ marginTop: spacing.xxs, flexWrap: 'wrap' }}>
          <Row gap="xxs">
            <Ionicons name="pricetag-outline" size={13} color={colors.textMuted} />
            <Text variant="caption" tone="muted">
              {item.category.name}
            </Text>
          </Row>
          <Text variant="caption" tone="muted">
            •
          </Text>
          <Text variant="caption" tone="muted">
            {TYPE_LABEL[item.type]}
          </Text>
        </Row>

        {showOwner ? (
          <Row gap="sm" style={{ marginTop: spacing.xs }}>
            <Avatar name={item.owner.displayName} size={24} />
            <Text variant="bodySm" tone="secondary">
              {item.owner.displayName}
            </Text>
          </Row>
        ) : null}
      </View>
    </Card>
  );
}
