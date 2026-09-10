import { type ReactNode } from 'react';
import { View } from 'react-native';

import { spacing } from '../tokens';

import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'need' | 'secondary';
}

/** Friendly placeholder that always points at the next useful action. */
export function EmptyState({
  title,
  body,
  icon,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing['3xl'] }}>
      {icon}
      <Text variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text tone="secondary" style={{ textAlign: 'center', maxWidth: 320 }}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.xs }}>
          <Button label={actionLabel} onPress={onAction} variant={actionVariant} />
        </View>
      ) : null}
    </View>
  );
}
