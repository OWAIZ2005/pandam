import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

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

import { SaveHeart } from '@/components/brand/SaveHeart';
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
  /** `list` is a full-width row, `grid` a half-width tile, `rail` a fixed-width tile,
   *  `feature` a large photo-led hero card. */
  variant?: 'list' | 'grid' | 'rail' | 'feature';
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
  const [hovered, setHovered] = useState(false);
  // Image zoom on hover: the photo drifts closer inside its frame.
  const zoom = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(hovered ? 1.07 : 1, { damping: 18, stiffness: 140 }) }],
  }));

  /* ------------------------------------------------------------- feature -- */
  if (variant === 'feature') {
    return (
      <View>
        <Press
          scale="sm"
          lift
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii['2xl'],
            overflow: 'hidden',
            ...shadows.md,
          }}
        >
          <View style={{ height: 300, overflow: 'hidden' }}>
            <Animated.View style={[{ flex: 1 }, zoom]}>
              <CoverTile
                seed={item.id}
                height={300}
                radius="none"
                uri={cover}
                icon={<Ionicons name={icon} size={120} color="rgba(255,255,255,0.5)" />}
              />
            </Animated.View>
            <View
              style={{
                position: 'absolute',
                top: spacing.md,
                left: spacing.md,
                right: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: radii.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 1.4,
                    color: colors.textInverse,
                  }}
                >
                  FRESH TODAY
                </Text>
              </View>
            </View>
            <View
              style={{
                position: 'absolute',
                left: spacing.lg,
                right: spacing.lg,
                bottom: spacing.lg,
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  lineHeight: 28,
                  fontWeight: '800',
                  letterSpacing: -0.6,
                  color: colors.textInverse,
                }}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Row gap="sm">
                <Avatar
                  name={item.owner.displayName}
                  size={20}
                  uri={mediaSrc(item.owner.avatarUrl)}
                />
                <Text variant="bodySm" style={{ color: 'rgba(255,253,249,0.9)' }} numberOfLines={1}>
                  {item.owner.displayName}
                  {item.owner.locationCity ? ` · ${item.owner.locationCity}` : ''}
                </Text>
              </Row>
            </View>
          </View>
          <Row
            justify="space-between"
            style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
          >
            <Row gap="xs">
              <Ionicons name="swap-horizontal" size={15} color={colors.accent} />
              <Text variant="label" tone="accent" style={{ fontWeight: '700' }}>
                Open to trade
              </Text>
            </Row>
            {price != null ? (
              <Text variant="numeric" numeric tone="secondary">
                or {formatMoney(price, item.pricing!.priceCurrency)}
              </Text>
            ) : (
              <Text variant="caption" tone="muted">
                {item.category.name}
              </Text>
            )}
          </Row>
        </Press>
        <View style={{ position: 'absolute', top: spacing.md, right: spacing.md }}>
          <SaveHeart />
        </View>
      </View>
    );
  }

  /* ---------------------------------------------------------------- tile -- */
  if (variant === 'grid' || variant === 'rail') {
    return (
      <View
        style={{
          flex: variant === 'grid' ? 1 : undefined,
          width: variant === 'rail' ? 176 : undefined,
        }}
      >
        <Press
          scale="sm"
          lift
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={{
            ...shadows.xs,
            flex: variant === 'grid' ? 1 : undefined,
            width: variant === 'rail' ? 176 : undefined,
            backgroundColor: colors.surface,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
          states={{ hover: { borderColor: colors.borderStrong } }}
        >
          <View style={{ height: variant === 'rail' ? 150 : 150, overflow: 'hidden' }}>
            <Animated.View style={[{ flex: 1 }, zoom]}>
              <CoverTile
                seed={item.id}
                height={150}
                radius="none"
                uri={cover}
                icon={<Ionicons name={icon} size={64} color="rgba(255,255,255,0.5)" />}
              />
            </Animated.View>
            <View
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: spacing.sm,
                right: spacing.sm,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <KindMark isHave={isHave} onPhoto />
            </View>
          </View>

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
        <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm }}>
          <SaveHeart size={30} />
        </View>
      </View>
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
