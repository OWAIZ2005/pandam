import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';

import { type PublicationStatus } from '@pandam/types';
import {
  Avatar,
  Badge,
  Button,
  CoverTile,
  Divider,
  IconButton,
  Meta,
  MetaItem,
  Notice,
  Press,
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

import { ErrorState } from '@/components/states';
import { ApiError } from '@/lib/api/client';
import { type MarketKind } from '@/lib/api/market';
import { mediaSrc } from '@/lib/api/media';
import { useSession } from '@/lib/auth/hooks';
import { STATUS_LABEL, TYPE_LABEL, formatMoney, statusBadgeKind, timeAgo } from '@/lib/format';
import { useItem, useSetItemStatus } from '@/lib/hooks/useMarket';
import { useCreatePayment } from '@/lib/hooks/usePayments';
import { categoryIcon, typeIcon } from '@/lib/icons';

/** Next status a one-tap action moves to, with a verb for the button. */
const STATUS_ACTIONS: Record<PublicationStatus, { to: PublicationStatus; label: string }[]> = {
  draft: [{ to: 'published', label: 'Publish' }],
  published: [
    { to: 'paused', label: 'Pause' },
    { to: 'archived', label: 'Archive' },
  ],
  paused: [
    { to: 'published', label: 'Publish' },
    { to: 'archived', label: 'Archive' },
  ],
  archived: [{ to: 'published', label: 'Re-publish' }],
};

/** A dark capsule that stays legible on top of any photograph. */
function PhotoTag({ children }: { children: React.ReactNode }) {
  return (
    <Row
      gap="xs"
      style={{
        backgroundColor: 'rgba(18,22,25,0.5)',
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
      }}
    >
      {children}
    </Row>
  );
}

export function ItemDetail({ kind, id }: { kind: MarketKind; id: string }) {
  const router = useRouter();
  const { user } = useSession();
  const query = useItem(kind, id);
  const setStatus = useSetItemStatus(kind);
  const createPayment = useCreatePayment();
  const isHave = kind === 'listing';

  const item = query.data;
  const mine = !!item && !!user && item.ownerId === user.id;
  const pricing = item?.pricing;
  const canBarter = isHave && (!pricing || pricing.transactionType !== 'sale');
  const canBuy =
    isHave && pricing && pricing.transactionType !== 'barter' && pricing.priceAmount != null;

  const buyError =
    createPayment.error instanceof ApiError
      ? createPayment.error.message
      : createPayment.error
        ? 'Could not start checkout. Try again.'
        : null;

  const handleBuyNow = () => {
    if (!item) return;
    createPayment.mutate(item.id, {
      onSuccess: (res) => {
        if (res.payment.checkoutUrl) void Linking.openURL(res.payment.checkoutUrl);
        router.push(`/(app)/payment/${res.payment.id}`);
      },
    });
  };

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/discover');

  if (query.isPending) {
    return (
      <Screen scroll>
        <SkeletonList count={3} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen scroll>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen scroll>
        <Text tone="secondary">This item isn’t available.</Text>
      </Screen>
    );
  }

  const gallery = item.images ?? [];

  return (
    <Screen
      scroll
      padded={false}
      edges={[]}
      footer={
        mine ? (
          /*
            Your own item: editing is the likely action, so it takes the
            primary slot. The status changes are housekeeping and sit quietly
            on one row below — they are not why you opened the page.
          */
          <Stack gap="sm">
            <Button
              label="Edit this item"
              size="lg"
              fullWidth
              onPress={() =>
                router.push(
                  isHave ? `/(app)/listing/${item.id}/edit` : `/(app)/need/${item.id}/edit`,
                )
              }
              leftIcon={<Ionicons name="create-outline" size={16} color={colors.textInverse} />}
            />
            <Row gap="sm">
              {STATUS_ACTIONS[item.status].map((a) => (
                <Button
                  key={a.to}
                  label={a.label}
                  variant={a.to === 'archived' ? 'quiet' : 'tertiary'}
                  size="sm"
                  style={{ flex: 1 }}
                  loading={setStatus.isPending}
                  onPress={() => setStatus.mutate({ id: item.id, status: a.to })}
                />
              ))}
            </Row>
          </Stack>
        ) : isHave ? (
          <Stack gap="sm">
            {/*
              When an item can be both bartered and bought, BARTER takes the
              filled button. It is what this product is for; the paid path is
              the fallback for people who would rather just pay. Giving "Buy"
              the primary would quietly turn PANDAM into a shop.
            */}
            {canBarter ? (
              <Button
                label="Offer a trade"
                size="lg"
                fullWidth
                onPress={() => router.push(`/(app)/offer/new?requestedListingId=${item.id}`)}
                leftIcon={<Ionicons name="swap-horizontal" size={17} color={colors.textInverse} />}
              />
            ) : null}
            {canBuy ? (
              <Button
                label={
                  createPayment.isPending
                    ? 'Starting checkout…'
                    : `Buy for ${formatMoney(pricing!.priceAmount!, pricing!.priceCurrency)}`
                }
                variant={canBarter ? 'secondary' : 'need'}
                size="lg"
                fullWidth
                loading={createPayment.isPending}
                onPress={handleBuyNow}
                leftIcon={
                  <Ionicons
                    name="card-outline"
                    size={17}
                    color={canBarter ? colors.textPrimary : colors.textInverse}
                  />
                }
              />
            ) : null}
            {buyError ? (
              <Text variant="caption" tone="danger" center>
                {buyError}
              </Text>
            ) : null}
          </Stack>
        ) : (
          <Stack gap="sm">
            <Button
              label={`See ${item.owner.displayName.split(' ')[0]}’s listings`}
              variant="need"
              size="lg"
              fullWidth
              onPress={() => router.push(`/(app)/(tabs)/discover?owner=${item.ownerId}`)}
              leftIcon={<Ionicons name="storefront-outline" size={17} color={colors.textInverse} />}
            />
            <Text variant="caption" tone="muted" center>
              A request is fulfilled by offering one of your own listings against theirs.
            </Text>
          </Stack>
        )
      }
    >
      {/* ------------------------------------------------------------ cover -- */}
      <CoverTile
        seed={item.id}
        height={260}
        radius="none"
        uri={mediaSrc(gallery[0]?.url)}
        icon={
          <Ionicons
            name={categoryIcon(item.category.slug)}
            size={120}
            color="rgba(255,255,255,0.4)"
          />
        }
        style={{
          paddingTop: spacing['3xl'],
          paddingHorizontal: layout.gutter,
          paddingBottom: spacing.lg,
          justifyContent: 'space-between',
        }}
      >
        <Row justify="space-between">
          <IconButton
            variant="glass"
            size={40}
            icon={<Ionicons name="chevron-back" size={20} color={colors.textInverse} />}
            accessibilityLabel="Go back"
            onPress={goBack}
          />
          {mine ? (
            <IconButton
              variant="glass"
              size={40}
              icon={<Ionicons name="create-outline" size={18} color={colors.textInverse} />}
              accessibilityLabel="Edit item"
              onPress={() =>
                router.push(
                  isHave ? `/(app)/listing/${item.id}/edit` : `/(app)/need/${item.id}/edit`,
                )
              }
            />
          ) : null}
        </Row>

        <Row gap="xs">
          <PhotoTag>
            <View
              style={{
                width: 3,
                height: 11,
                borderRadius: 2,
                backgroundColor: isHave ? colors.accentBright : colors.needBright,
              }}
            />
            <Text variant="caption" style={{ color: colors.textInverse, fontWeight: '600' }}>
              {isHave ? 'Someone has this' : 'Someone needs this'}
            </Text>
          </PhotoTag>
          {gallery.length > 1 ? (
            <PhotoTag>
              <Ionicons name="images-outline" size={11} color={colors.textInverse} />
              <Text variant="caption" numeric style={{ color: colors.textInverse }}>
                {gallery.length}
              </Text>
            </PhotoTag>
          ) : null}
        </Row>
      </CoverTile>

      {/* ------------------------------------------------------------- body -- */}
      <View
        style={{
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingVertical: spacing['2xl'],
        }}
      >
        <Stack gap="2xl">
          {/* ------------------------------------------------------ title -- */}
          <Stack gap="md">
            {mine ? (
              <Badge label={STATUS_LABEL[item.status]} kind={statusBadgeKind(item.status)} dot />
            ) : null}

            <Text variant="display">{item.title}</Text>

            {/*
              Price on its own line under the title, not beside it. Beside it,
              a long title and a long price fought for one line and something
              always truncated; underneath, the price gets the emphasis of its
              own line and the title can run as long as it needs to.
            */}
            {pricing && pricing.priceAmount != null ? (
              <Row gap="sm" align="baseline">
                <Text variant="numericLarge" numeric tone="need">
                  {formatMoney(pricing.priceAmount, pricing.priceCurrency)}
                </Text>
                {pricing.transactionType === 'both' ? (
                  <Text variant="bodySm" tone="muted">
                    or trade for it
                  </Text>
                ) : null}
              </Row>
            ) : null}

            <Meta wrap>
              <MetaItem
                icon={
                  <Ionicons
                    name={categoryIcon(item.category.slug)}
                    size={12}
                    color={colors.textMuted}
                  />
                }
                label={item.category.name}
              />
              <MetaItem
                icon={<Ionicons name={typeIcon(item.type)} size={12} color={colors.textMuted} />}
                label={TYPE_LABEL[item.type]}
              />
              {item.owner.locationCity ? (
                <MetaItem
                  icon={<Ionicons name="location-outline" size={12} color={colors.textMuted} />}
                  label={item.owner.locationCity}
                />
              ) : null}
              <MetaItem label={timeAgo(item.createdAt)} />
            </Meta>
          </Stack>

          {/* ---------------------------------------------------- gallery -- */}
          {gallery.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -layout.gutter }}
              contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: layout.gutter }}
            >
              {/* The first photo is already the hero above, so the strip shows
                  the rest rather than repeating it. */}
              {gallery.slice(1).map((image) => (
                <Image
                  key={image.id}
                  source={{ uri: mediaSrc(image.url) }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: radii.md,
                    backgroundColor: colors.surfaceMuted,
                  }}
                  contentFit="cover"
                  transition={150}
                />
              ))}
            </ScrollView>
          ) : null}

          {/* ------------------------------------------------ description -- */}
          <Stack gap="sm">
            <Text variant="label" tone="muted">
              Description
            </Text>
            <Text variant="body" style={{ lineHeight: 23, maxWidth: layout.proseMaxWidth }}>
              {item.description}
            </Text>
          </Stack>

          <Divider tone="soft" />

          {/* ------------------------------------------------------ owner -- */}
          <Row gap="md">
            <Avatar name={item.owner.displayName} size={44} uri={mediaSrc(item.owner.avatarUrl)} />
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Text variant="caption" tone="muted">
                {mine ? 'Listed by you' : isHave ? 'Offered by' : 'Requested by'}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {item.owner.displayName}
              </Text>
              {(item.owner.locationCity ?? item.owner.username) ? (
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {item.owner.locationCity ?? `@${item.owner.username}`}
                </Text>
              ) : null}
            </View>
            {!mine ? (
              <Button
                label="Similar"
                variant="tertiary"
                size="sm"
                onPress={() => router.push(`/(app)/(tabs)/discover?category=${item.category.id}`)}
              />
            ) : null}
          </Row>

          {/* ------------------------------------------------------ safety -- */}
          <Notice
            kind={canBuy ? 'info' : 'neutral'}
            icon={
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={canBuy ? colors.info : colors.textMuted}
              />
            }
          >
            {canBuy
              ? 'Payment is handled securely by Razorpay — PANDAM never sees or stores your card or bank details.'
              : 'PANDAM never handles money. Agree the swap directly with the other person and trade goods for goods.'}
          </Notice>

          {!mine ? (
            <Press
              scale="sm"
              accessibilityRole="button"
              accessibilityLabel={`Report this ${isHave ? 'listing' : 'request'}`}
              hitSlop={8}
              onPress={() =>
                router.push(
                  `/(app)/report?subjectType=${isHave ? 'listing' : 'need'}&subjectId=${item.id}` +
                    `&label=${encodeURIComponent(item.title)}`,
                )
              }
              style={{ alignSelf: 'center', padding: spacing.sm, borderRadius: radii.sm }}
            >
              <Row gap="xs">
                <Ionicons name="flag-outline" size={12} color={colors.textMuted} />
                <Text variant="caption" tone="muted">
                  Report this {isHave ? 'listing' : 'request'}
                </Text>
              </Row>
            </Press>
          ) : null}
        </Stack>
      </View>
    </Screen>
  );
}
