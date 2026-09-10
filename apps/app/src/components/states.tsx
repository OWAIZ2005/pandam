/**
 * Shared loading / error / empty presentation so every screen behaves the same.
 * Never render a blank screen while data loads.
 */
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, SkeletonList, Text, colors, spacing } from '@pandam/ui';

import { ApiError } from '@/lib/api/client';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const network = error instanceof ApiError && error.status === 0;
  const forbidden = error instanceof ApiError && (error.status === 401 || error.status === 403);
  const title = network
    ? 'You appear to be offline'
    : forbidden
      ? 'You don’t have access to this'
      : 'Something went wrong';
  const body = network
    ? 'Check your connection and try again.'
    : error instanceof ApiError && error.status >= 500
      ? 'The PANDAM service had a hiccup. Please try again.'
      : error instanceof ApiError
        ? error.message
        : 'An unexpected error occurred.';
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing['3xl'] }}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
      <Text variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text tone="secondary" style={{ textAlign: 'center', maxWidth: 320 }}>
        {body}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: spacing.xs }}>
          <Button label="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export interface QueryStateProps {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  skeleton?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}

/** Branch on a query's state; falls back to a skeleton list + empty state. */
export function QueryState({
  isPending,
  isError,
  error,
  isEmpty,
  onRetry,
  skeleton,
  empty,
  children,
}: QueryStateProps) {
  if (isPending) return <>{skeleton ?? <SkeletonList />}</>;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return <>{children}</>;
}
