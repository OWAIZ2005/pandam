import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { type PublicationStatus } from '@pandam/types';
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
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ErrorState } from '@/components/states';
import { type MarketKind } from '@/lib/api/market';
import { useSession } from '@/lib/auth/hooks';
import { STATUS_LABEL, TYPE_LABEL, statusBadgeKind, timeAgo } from '@/lib/format';
import { useItem, useSetItemStatus } from '@/lib/hooks/useMarket';

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

export function ItemDetail({ kind, id }: { kind: MarketKind; id: string }) {
  const router = useRouter();
  const { user } = useSession();
  const query = useItem(kind, id);
  const setStatus = useSetItemStatus(kind);
  const isHave = kind === 'listing';

  const item = query.data;
  const mine = !!item && !!user && item.ownerId === user.id;

  return (
    <Screen scroll>
      <AppHeader title={isHave ? 'I have' : 'I need'} back />
      {query.isPending ? (
        <SkeletonList count={2} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !item ? (
        <Text tone="secondary">This item isn’t available.</Text>
      ) : (
        <Stack gap="xl">
          <Stack gap="sm">
            <Row gap="xs">
              <Badge label={isHave ? 'I have' : 'I need'} kind={isHave ? 'have' : 'need'} />
              {mine ? (
                <Badge label={STATUS_LABEL[item.status]} kind={statusBadgeKind(item.status)} />
              ) : null}
            </Row>
            <Text variant="h1">{item.title}</Text>
            <Row gap="sm" style={{ flexWrap: 'wrap' }}>
              <Row gap="xxs">
                <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
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
              <Text variant="caption" tone="muted">
                •
              </Text>
              <Text variant="caption" tone="muted">
                {timeAgo(item.createdAt)}
              </Text>
            </Row>
          </Stack>

          <Text variant="body" style={{ lineHeight: 24 }}>
            {item.description}
          </Text>

          <Card padded>
            <Row gap="md">
              <Avatar name={item.owner.displayName} size={40} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{item.owner.displayName}</Text>
                {item.owner.username ? (
                  <Text variant="caption" tone="muted">
                    @{item.owner.username}
                  </Text>
                ) : null}
              </View>
              {!mine ? (
                <Button
                  label="Their items"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push(`/(app)/(tabs)/discover?category=${item.category.id}`)}
                />
              ) : null}
            </Row>
          </Card>

          <Divider />

          {mine ? (
            <Stack gap="sm">
              <Button
                label="Edit"
                variant="secondary"
                fullWidth
                onPress={() =>
                  router.push(
                    isHave ? `/(app)/listing/${item.id}/edit` : `/(app)/need/${item.id}/edit`,
                  )
                }
                leftIcon={<Ionicons name="create-outline" size={16} color={colors.textPrimary} />}
              />
              <Row gap="sm">
                {STATUS_ACTIONS[item.status].map((a) => (
                  <Button
                    key={a.to}
                    label={a.label}
                    variant="ghost"
                    size="sm"
                    loading={setStatus.isPending}
                    onPress={() => setStatus.mutate({ id: item.id, status: a.to })}
                  />
                ))}
              </Row>
            </Stack>
          ) : (
            <Stack gap="sm">
              <Button
                label={isHave ? 'Offer a trade' : 'Offer what they need'}
                fullWidth
                disabled
                onPress={() => {}}
                leftIcon={<Ionicons name="swap-horizontal" size={16} color={colors.textInverse} />}
              />
              <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                Sending an offer and arranging the barter arrives in the next phase.
              </Text>
            </Stack>
          )}
        </Stack>
      )}
    </Screen>
  );
}
