import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { type MarketItem } from '@pandam/types';
import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  Row,
  Screen,
  SkeletonList,
  Stack,
  Text,
  colors,
  spacing,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ItemCard } from '@/components/ItemCard';
import { ErrorState } from '@/components/states';
import { useLogout, useSession } from '@/lib/auth/hooks';
import { type MarketKind } from '@/lib/api/market';
import { useMyItems } from '@/lib/hooks/useMarket';

function MyItemsSection({
  kind,
  onOpen,
  onAdd,
}: {
  kind: MarketKind;
  onOpen: (item: MarketItem) => void;
  onAdd: () => void;
}) {
  const q = useMyItems(kind);
  const isHave = kind === 'listing';
  return (
    <View>
      <Row justify="space-between" style={{ marginBottom: spacing.sm }}>
        <Text variant="h3">{isHave ? 'Things I have' : 'Things I need'}</Text>
        <Pressable onPress={onAdd} accessibilityRole="button" hitSlop={8}>
          <Row gap="xxs">
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text variant="label" tone="accent">
              Add
            </Text>
          </Row>
        </Pressable>
      </Row>
      {q.isPending ? (
        <SkeletonList count={2} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (q.data?.length ?? 0) === 0 ? (
        <Card padded>
          <Stack gap="sm">
            <Text tone="secondary">
              {isHave
                ? 'You haven’t added anything you have yet.'
                : 'What are you looking for? Add something you need.'}
            </Text>
            <Button
              label={isHave ? 'Add something I have' : 'Add something I need'}
              variant={isHave ? 'primary' : 'need'}
              size="sm"
              onPress={onAdd}
            />
          </Stack>
        </Card>
      ) : (
        <Stack gap="md">
          {q.data!.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              showOwner={false}
              showStatus
              onPress={() => onOpen(it)}
            />
          ))}
        </Stack>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useSession();
  const logout = useLogout();

  const open = (item: MarketItem) =>
    router.push(item.kind === 'listing' ? `/(app)/listing/${item.id}` : `/(app)/need/${item.id}`);

  if (!profile) {
    return (
      <Screen scroll>
        <AppHeader title="Profile" />
        <EmptyState title="Profile unavailable" body="Try again in a moment." />
      </Screen>
    );
  }

  const location = [profile.locationCity, profile.locationRegion, profile.locationCountry]
    .filter(Boolean)
    .join(', ');

  return (
    <Screen scroll>
      <AppHeader title="Profile" />
      <Stack gap="2xl">
        <Card padded elevated>
          <Stack gap="md">
            <Row gap="md">
              <Avatar name={profile.displayName} size={56} />
              <View style={{ flex: 1 }}>
                <Text variant="h2">{profile.displayName}</Text>
                {profile.username ? (
                  <Text tone="muted">@{profile.username}</Text>
                ) : (
                  <Text tone="muted">{user?.email}</Text>
                )}
              </View>
            </Row>
            {profile.bio ? <Text tone="secondary">{profile.bio}</Text> : null}
            {location ? (
              <Row gap="xxs">
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text variant="caption" tone="muted">
                  {location}
                </Text>
              </Row>
            ) : null}
            <Divider />
            <Button
              label="Edit profile"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/(app)/edit-profile')}
              leftIcon={<Ionicons name="create-outline" size={16} color={colors.textPrimary} />}
            />
          </Stack>
        </Card>

        <MyItemsSection
          kind="listing"
          onOpen={open}
          onAdd={() => router.push('/(app)/new-listing')}
        />
        <MyItemsSection kind="need" onOpen={open} onAdd={() => router.push('/(app)/new-need')} />

        <Button
          label={logout.isPending ? 'Signing out…' : 'Sign out'}
          variant="ghost"
          fullWidth
          disabled={logout.isPending}
          onPress={() =>
            logout.mutate(undefined, { onSettled: () => router.replace('/(auth)/login') })
          }
        />
      </Stack>
    </Screen>
  );
}
