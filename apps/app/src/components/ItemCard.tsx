import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { type MarketItem } from '@pandam/types';
import {
  Avatar,
  Badge,
  Card,
  CoverTile,
  Meta,
  MetaItem,
  Press,
  Row,
  Text,
  colors,
  radii,
  shadows,
  spacing,
} from '@pandam/ui';

import { mediaSrc, primaryImage } from '@/lib/api/media';
import { STATUS_LABEL, TYPE_LABEL, formatMoney, statusBadgeKind, timeAgo } from '@/lib/format';
import { categoryIcon } from '@/lib/icons';

export interface ItemCardProps {
  item: MarketItem;
  onPress?: () => void;
  /** Show the owner row (hidden on "my items" lists). */
  showOwner?: boolean;
  /** Show the publication-status badge (used on the profile / "mine" lists). */
  showStatus?: boolean;
  /** `list` is a full-width row, `grid` a half-width tile, `rail` a fixed-width tile. */
  variant?: 'list' | 'grid' | 'rail';
}

/**
 * The HAVE / NEED marker.
 *
 * A 3px coloured bar plus a word, not a pastel pill. On a photograph the bar
 * survives any background, and at the size a card actually gets on a phone it
 * is readable from further away than a tinted badge — which matters because
 * this is the single most important fact about any item in the product.
 */
function KindMark({ isHave, onPhoto = false }: { isHave: boolean; onPhoto?: boolean }) {
  const color = isHave ? colors.accent : colors.need;

  if (onPhoto) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          alignSelf: 'flex-start',
          backgroundColor: 'rgba(36,27,22,0.55)',
          borderRadius: radii.pill,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
        }}
      >
        <View style={{ width: 3, height: 10, borderRadius: 2, backgroundColor: color }} />
        <Text variant="caption" style={{ color: colors.textInverse, fontWeight: '600' }}>
          {isHave ? 'Have' : 'Need'}
        </Text>
      </View>
    );
  }

  return (
    <Row gap="xs">
      <View style={{ width: 3, height: 11, borderRadius: 2, backgroundColor: color }} />
      <Text variant="caption" tone={isHave ? 'accent' : 'need'} style={{ fontWeight: '600' }}>
        {isHave ? 'Have' : 'Need'}
      </Text>
    </Row>
  );
}

/**
 * A listing ("I HAVE") or need ("I NEED") card.
 *
 * The cover shows the item's first photo when it has one; when it does not —
 * common, and always will be — `CoverTile` falls back to a gradient keyed to
 * the item id, so a scrolling wall of cards never reads as a grey list.
 */
export function ItemCard({
  item,
  onPress,
  showOwner = true,
  showStatus = false,
  variant = 'list',
}: ItemCardProps) {
  const isHave = item.kind === 'listing';
  const icon = categoryIcon(item.category.slug);
  const cover = primaryImage(item.images);
  const price = item.pricing?.priceAmount;
  const label = `${isHave ? 'Have' : 'Need'}: ${item.title}`;

  /* ---------------------------------------------------------------- tile -- */
  if (variant === 'grid' || variant === 'rail') {
    return (
      <Press
        scale="sm"
        lift
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          ...shadows.xs,
          flex: variant === 'grid' ? 1 : undefined,
          width: variant === 'rail' ? 176 : undefined,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
        states={{ hover: { borderColor: colors.borderStrong } }}
      >
        <CoverTile
          seed={item.id}
          height={variant === 'rail' ? 150 : 140}
          radius="none"
          uri={cover}
          icon={<Ionicons name={icon} size={64} color="rgba(255,255,255,0.5)" />}
          style={{ padding: spacing.sm, justifyContent: 'space-between' }}
        >
          <KindMark isHave={isHave} onPhoto />
        </CoverTile>

        <View style={{ padding: spacing.md, gap: spacing.xs }}>
          <Text
            variant="bodyStrong"
            numberOfLines={2}
            style={{ minHeight: 44, letterSpacing: -0.2 }}
          >
            {item.title}
          </Text>

          {price != null ? (
            <Text variant="numeric" numeric tone="need">
              {formatMoney(price, item.pricing!.priceCurrency)}
            </Text>
          ) : null}

          <Meta>
            <MetaItem
              icon={<Ionicons name={icon} size={11} color={colors.textMuted} />}
              label={item.category.name}
            />
            {item.owner.locationCity ? <MetaItem label={item.owner.locationCity} /> : null}
          </Meta>

          {showOwner ? (
            <Row gap="xs" style={{ marginTop: spacing.xxs }}>
              <Avatar
                name={item.owner.displayName}
                size={16}
                uri={mediaSrc(item.owner.avatarUrl)}
              />
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                {item.owner.displayName}
              </Text>
            </Row>
          ) : showStatus ? (
            <View style={{ marginTop: spacing.xxs }}>
              <Badge label={STATUS_LABEL[item.status]} kind={statusBadgeKind(item.status)} dot />
            </View>
          ) : null}
        </View>
      </Press>
    );
  }

  /* ---------------------------------------------------------------- list -- */
  return (
    <Card onPress={onPress} padded={false} accessibilityLabel={label}>
      <Row gap="md" align="flex-start" style={{ padding: spacing.md }}>
        <CoverTile
          seed={item.id}
          height={84}
          radius="lg"
          uri={cover}
          icon={<Ionicons name={icon} size={44} color="rgba(255,255,255,0.5)" />}
          style={{ width: 84 }}
        />

        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
          <Row justify="space-between" gap="sm" align="center">
            <KindMark isHave={isHave} />
            <Row gap="xs">
              {showStatus ? (
                <Badge label={STATUS_LABEL[item.status]} kind={statusBadgeKind(item.status)} dot />
              ) : null}
              <Text variant="caption" tone="faint">
                {timeAgo(item.createdAt)}
              </Text>
            </Row>
          </Row>

          {/*
            The title is the one thing that must be readable while scrolling
            past, so it is the only element here above caption size.
          */}
          <Text variant="h3" numberOfLines={2}>
            {item.title}
          </Text>

          <Text variant="bodySm" tone="secondary" numberOfLines={2}>
            {item.description}
          </Text>

          <Row justify="space-between" gap="sm" style={{ marginTop: spacing.xxs }}>
            <Meta>
              <MetaItem
                icon={<Ionicons name={icon} size={11} color={colors.textMuted} />}
                label={item.category.name}
              />
              <MetaItem label={TYPE_LABEL[item.type]} />
              {showOwner ? <MetaItem label={item.owner.displayName} /> : null}
            </Meta>

            {price != null ? (
              <Text variant="numeric" numeric tone="need">
                {formatMoney(price, item.pricing!.priceCurrency)}
              </Text>
            ) : null}
          </Row>
        </View>
      </Row>
    </Card>
  );
}
