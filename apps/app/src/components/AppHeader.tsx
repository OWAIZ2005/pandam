import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton, Row, Text, colors, spacing } from '@pandam/ui';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

/** Lightweight in-screen header (native headers are disabled app-wide). */
export function AppHeader({ title, subtitle, back = false, right }: AppHeaderProps) {
  const router = useRouter();
  return (
    <View style={{ paddingBottom: spacing.md, gap: spacing.xxs }}>
      <Row justify="space-between">
        <Row gap="xs" style={{ flex: 1 }}>
          {back ? (
            <IconButton
              icon={<Ionicons name="chevron-back" size={24} color={colors.textPrimary} />}
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)'))}
            />
          ) : null}
          <Text variant={back ? 'h2' : 'h1'} numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Text>
        </Row>
        {right}
      </Row>
      {subtitle ? (
        <Text tone="secondary" style={{ marginLeft: back ? 44 : 0 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
