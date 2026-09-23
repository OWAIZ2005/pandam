import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, View } from 'react-native';

import { type OfferView } from '@pandam/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Meta,
  MetaItem,
  Notice,
  Row,
  Screen,
  SkeletonList,
  Stack,
  Text,
  colors,
  layout,
  radii,
  spacing,
  useToast,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ErrorState } from '@/components/states';
import { IS_DEMO_DATA, demoOffers, demoQuery } from '@/dummy';
import { ApiError } from '@/lib/api/client';
import { mediaSrc } from '@/lib/api/media';
import { TYPE_LABEL, timeAgo } from '@/lib/format';
import { useOffer, useRespondToOffer } from '@/lib/hooks/useOffers';

const STATUS_KIND: Record<OfferView['status'], 'neutral' | 'success' | 'danger' | 'warning'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  expired: 'neutral',
};

const STATUS_LABEL: Record<OfferView['status'], string> = {
  pending: 'Awaiting reply',
  accepted: 'Accepted',
  rejected: 'Declined',
  cancelled: 'Withdrawn',
  expired: 'Expired',
};

/**
 * One side of the swap.
 *
 * Stacked vertically rather than side by side. Two half-width tiles gave each
 * item about fourteen characters before truncating, which on the screen where
 * you decide whether to accept a trade is the one thing you cannot afford to
 * hide. Full width also lets the arrow sit BETWEEN them, which is what makes
 * the direction of the exchange legible at a glance.
 */
function Side({
  label,
  title,
  type,
  category,
  tone,
}: {
  label: string;
  title: string;
  type: keyof typeof TYPE_LABEL;
  category: string;
  tone: 'have' | 'need';
}) {
  const have = tone === 'have';
  return (
    <View
      style={{
        backgroundColor: have ? colors.accentSoft : colors.needSoft,
        borderWidth: 1,
        borderColor: have ? colors.accentBorder : colors.needBorder,
        borderRadius: radii.md,
        padding: spacing.lg,
        gap: spacing.xs,
      }}
    >
      <Text variant="caption" tone={have ? 'accent' : 'need'} style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <Text variant="h3">{title}</Text>
      <Meta>
        <MetaItem label={TYPE_LABEL[type]} />
        <MetaItem label={category} />
      </Meta>
    </View>
  );
}

export default function OfferDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const liveOffer = useOffer(id);
  const demoOffer = IS_DEMO_DATA ? demoOffers.find((o) => o.id === id) : undefined;
  const offer = demoOffer ? demoQuery(liveOffer, demoOffer) : liveOffer;
  const respond = useRespondToOffer();

  const respondError =
    respond.error instanceof ApiError
      ? respond.error.message
      : respond.error
        ? 'Could not update the offer. Check your connection and try again.'
        : null;

  if (offer.isPending) {
    return (
      <Screen scroll>
        <AppHeader title="Offer" back />
        <SkeletonList count={2} />
      </Screen>
    );
  }
  if (offer.isError) {
    return (
      <Screen scroll>
        <AppHeader title="Offer" back />
        <ErrorState error={offer.error} onRetry={() => void offer.refetch()} />
      </Screen>
    );
  }
  const o = offer.data;
  if (!o) return null;

  const canRespond = o.status === 'pending';
  const iAmRecipient = !o.isMine;
  const person = o.isMine ? o.toUser : o.fromUser;

  /* Accepting is irreversible and creates a transaction plus a chat, so it
     asks first. Declining and withdrawing are recoverable — you can always
     make the offer again — so those act immediately. */
  const confirmAccept = () =>
    Alert.alert(
      'Accept this trade?',
      `You and ${person.displayName} will both be committed. Your two items come off the marketplace and a chat opens so you can arrange the swap.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Accept trade',
          onPress: () =>
            respond.mutate(
              { id: o.id, action: 'accept' },
              {
                onSuccess: () => {
                  toast.success('Trade agreed — a chat is open in Messages.');
                  router.push('/(app)/transactions');
                },
              },
            ),
        },
      ],
    );

  return (
    <Screen
      scroll
      padded={false}
      edges={['top', 'bottom']}
      footer={
        canRespond ? (
          iAmRecipient ? (
            <Stack gap="sm">
              <Button
                label="Accept trade"
                size="lg"
                fullWidth
                loading={respond.isPending}
                onPress={confirmAccept}
                leftIcon={<Ionicons name="checkmark" size={17} color={colors.textInverse} />}
              />
              <Button
                label="Decline"
                variant="quiet"
                fullWidth
                loading={respond.isPending}
                onPress={() =>
                  respond.mutate(
                    { id: o.id, action: 'reject' },
                    { onSuccess: () => toast.show({ message: 'Offer declined.' }) },
                  )
                }
              />
            </Stack>
          ) : (
            <Button
              label="Withdraw offer"
              variant="quiet"
              fullWidth
              loading={respond.isPending}
              onPress={() =>
                respond.mutate(
                  { id: o.id, action: 'cancel' },
                  { onSuccess: () => toast.show({ message: 'Offer withdrawn.' }) },
                )
              }
            />
          )
        ) : o.status === 'accepted' ? (
          <Button
            label="Open transaction"
            size="lg"
            fullWidth
            onPress={() => router.push('/(app)/transactions')}
            leftIcon={<Ionicons name="repeat" size={17} color={colors.textInverse} />}
          />
        ) : undefined
      }
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
        <AppHeader
          title={o.isMine ? 'Your offer' : 'Offer for you'}
          subtitle={o.isMine ? 'Waiting on the other person' : undefined}
          back
        />

        <Stack gap="xl">
          <Row justify="space-between" align="center" gap="md">
            <Row gap="sm" style={{ flex: 1, minWidth: 0 }}>
              <Avatar name={person.displayName} size={38} uri={mediaSrc(person.avatarUrl)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {person.displayName}
                </Text>
                <Text variant="caption" tone="muted">
                  {o.isMine ? 'You sent this' : 'Sent to you'} · {timeAgo(o.createdAt)}
                </Text>
              </View>
            </Row>
            <Badge label={STATUS_LABEL[o.status]} kind={STATUS_KIND[o.status]} dot />
          </Row>

          {/* -------------------------------------------------- the trade -- */}
          <Stack gap="sm">
            <Side
              label={o.isMine ? 'You give' : 'They give'}
              title={o.offered.title}
              type={o.offered.type}
              category={o.offered.category.name}
              tone="have"
            />

            <Row gap="md" align="center">
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radii.pill,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="swap-vertical" size={15} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </Row>

            <Side
              label={o.isMine ? 'You get' : 'They get'}
              title={o.requested.title}
              type={o.requested.type}
              category={o.requested.category.name}
              tone="need"
            />
          </Stack>

          {o.message ? (
            <Card padded>
              <Stack gap="xs">
                <Text variant="label" tone="muted">
                  Their message
                </Text>
                <Text variant="body">{o.message}</Text>
              </Stack>
            </Card>
          ) : null}

          {respondError ? (
            <Notice
              kind="danger"
              icon={<Ionicons name="alert-circle" size={16} color={colors.danger} />}
            >
              {respondError}
            </Notice>
          ) : null}

          {canRespond && iAmRecipient ? (
            <Notice
              kind="neutral"
              icon={
                <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
              }
            >
              Accepting takes both items off the marketplace and opens a chat. No money is involved
              at any point.
            </Notice>
          ) : null}
        </Stack>
      </View>
    </Screen>
  );
}
