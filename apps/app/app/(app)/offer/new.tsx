import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { type MarketItem } from '@pandam/types';
import {
  Button,
  Card,
  CoverTile,
  Field,
  Meta,
  MetaItem,
  Notice,
  Press,
  Screen,
  SkeletonList,
  Stack,
  Text,
  colors,
  layout,
  radii,
  spacing,
  useMotionOK,
  useToast,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { TradeStage } from '@/components/brand/TradeStage';
import { ErrorState } from '@/components/states';
import { IS_DEMO_DATA, demoItem, demoMyListings, demoQuery } from '@/dummy';
import { ApiError } from '@/lib/api/client';
import { primaryImage } from '@/lib/api/media';
import { TYPE_LABEL } from '@/lib/format';
import { useCreateOffer } from '@/lib/hooks/useOffers';
import { useItem, useMyItems } from '@/lib/hooks/useMarket';
import { categoryIcon } from '@/lib/icons';

/**
 * One of your listings, offered as the thing you would give.
 *
 * A choose-one list needs a real selection control. The previous version put
 * a 2px coloured ring around the whole card, which reads as a hover state
 * rather than a choice and shifted the layout as the ring appeared. A radio
 * mark says "pick one of these" before you have picked anything.
 */
function SelectableItem({
  item,
  selected,
  onSelect,
}: {
  item: MarketItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Press
      scale="none"
      dim={false}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={item.title}
      onPress={onSelect}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
      }}
      states={{ hover: selected ? null : { borderColor: colors.borderStrong } }}
    >
      <CoverTile
        seed={item.id}
        height={52}
        radius="md"
        uri={primaryImage(item.images)}
        icon={
          <Ionicons
            name={categoryIcon(item.category.slug)}
            size={30}
            color="rgba(255,255,255,0.5)"
          />
        }
        style={{ width: 52 }}
      />

      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.title}
        </Text>
        <Meta>
          <MetaItem label={TYPE_LABEL[item.type]} />
          <MetaItem label={item.category.name} />
        </Meta>
      </View>

      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radii.pill,
          borderWidth: selected ? 0 : 1.5,
          borderColor: colors.borderStrong,
          backgroundColor: selected ? colors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
      </View>
    </Press>
  );
}

/**
 * "Offer a trade" — pick one of the caller's own published, barter-eligible
 * listings to exchange for `requestedListingId`. Offers are always
 * listing-for-listing; there is no direct "offer against a need" (a need
 * carries no item of its own to give back).
 */
export default function NewOfferScreen() {
  const router = useRouter();
  const toast = useToast();
  const { requestedListingId } = useLocalSearchParams<{ requestedListingId: string }>();
  const liveRequested = useItem('listing', requestedListingId);
  const demoRequested = IS_DEMO_DATA ? demoItem(requestedListingId ?? '') : undefined;
  const requested = demoRequested ? demoQuery(liveRequested, demoRequested) : liveRequested;
  const mine = demoQuery(useMyItems('listing'), demoMyListings);
  const create = useCreateOffer();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // Visual only: hold the "trade proposal sent" moment briefly before the
  // existing toast + navigation run, unchanged.
  const motionOK = useMotionOK();
  const [sent, setSent] = useState(false);
  const sentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (sentTimer.current) clearTimeout(sentTimer.current);
    },
    [],
  );

  const eligible = useMemo(
    () =>
      (mine.data ?? []).filter(
        (l) => l.status === 'published' && l.pricing?.transactionType !== 'sale',
      ),
    [mine.data],
  );

  const selected = eligible.find((i) => i.id === selectedId) ?? null;

  const formError =
    create.error instanceof ApiError
      ? create.error.message
      : create.error
        ? 'Could not send the offer. Check your connection and try again.'
        : null;

  const submit = () => {
    if (!selectedId || !requested.data || sent) return;
    create.mutate(
      {
        toUserId: requested.data.ownerId,
        offeredListingId: selectedId,
        requestedListingId: requested.data.id,
        message: message.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setSent(true);
          sentTimer.current = setTimeout(
            () => {
              toast.success('Offer sent. You will hear when they reply.');
              router.replace(`/(app)/offer/${res.offer.id}`);
            },
            motionOK ? 1300 : 700,
          );
        },
      },
    );
  };

  return (
    <Screen
      scroll
      padded={false}
      edges={['top', 'bottom']}
      footer={
        <Stack gap="sm">
          {formError ? (
            <Notice
              kind="danger"
              icon={<Ionicons name="alert-circle" size={16} color={colors.danger} />}
            >
              {formError}
            </Notice>
          ) : null}
          <Button
            label={sent ? 'Sent' : create.isPending ? 'Sending…' : 'Send offer'}
            size="lg"
            fullWidth
            disabled={!selectedId || sent}
            loading={create.isPending}
            onPress={submit}
            leftIcon={
              <Ionicons
                name={sent ? 'checkmark' : 'paper-plane-outline'}
                size={17}
                color={colors.textInverse}
              />
            }
          />
          {!selectedId && eligible.length > 0 ? (
            <Text variant="caption" tone="muted" center>
              Pick one of your listings to offer.
            </Text>
          ) : null}
        </Stack>
      }
    >
      <View
        style={{
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing.lg,
          paddingBottom: spacing['3xl'],
        }}
      >
        <AppHeader
          title="Offer a trade"
          subtitle="Goods for goods — no money changes hands."
          back
        />

        <Stack gap="2xl">
          {/* ------------------------------------------------ what you get -- */}
          {requested.isPending ? (
            <SkeletonList count={1} />
          ) : requested.data ? (
            <TradeStage
              sending={create.isPending}
              sent={sent}
              get={{
                id: requested.data.id,
                title: requested.data.title,
                photo: primaryImage(requested.data.images),
              }}
              give={
                selected
                  ? { id: selected.id, title: selected.title, photo: primaryImage(selected.images) }
                  : null
              }
            />
          ) : null}

          {/* ----------------------------------------------- what you give -- */}
          <View>
            <View style={{ gap: 2, marginBottom: spacing.md }}>
              <Text variant="h3">What will you give?</Text>
              <Text variant="bodySm" tone="secondary">
                Pick one of your published listings. Sale-only items cannot be traded.
              </Text>
            </View>

            {mine.isPending ? (
              <SkeletonList count={2} />
            ) : mine.isError ? (
              <ErrorState error={mine.error} onRetry={() => void mine.refetch()} />
            ) : eligible.length === 0 ? (
              <Card padded>
                <Stack gap="md">
                  <Text variant="bodySm" tone="secondary">
                    You have nothing to offer yet — a trade needs something from both sides. Add a
                    listing and come back; this item will still be here.
                  </Text>
                  <Button
                    label="Add something I have"
                    size="sm"
                    onPress={() => router.push('/(app)/new-listing')}
                  />
                </Stack>
              </Card>
            ) : (
              <Stack gap="sm">
                {eligible.map((item) => (
                  <SelectableItem
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => setSelectedId(selectedId === item.id ? null : item.id)}
                  />
                ))}
              </Stack>
            )}
          </View>

          {/* --------------------------------------------------- the swap -- */}
          {/*
            Once both halves are known, spell the trade out in one sentence.
            It is the last thing read before sending, and it is cheaper to
            check here than to withdraw an offer afterwards.
          */}
          {selected && requested.data ? (
            <Notice
              kind="success"
              icon={<Ionicons name="swap-horizontal" size={16} color={colors.accent} />}
            >
              You give “{selected.title}” and get “{requested.data.title}”.
            </Notice>
          ) : null}

          <Field
            label="Add a message"
            optional
            placeholder="Say hello, or suggest where and when to swap…"
            hint="Offers with a message are answered more often."
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </Stack>
      </View>
    </Screen>
  );
}
