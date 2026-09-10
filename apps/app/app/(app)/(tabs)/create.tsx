import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen, Stack, Text, colors, radii, spacing } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';

function BigChoice({
  tone,
  icon,
  title,
  body,
  onPress,
}: {
  tone: 'have' | 'need';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
}) {
  const bg = tone === 'have' ? colors.accent : colors.need;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderRadius: radii.lg,
        padding: spacing.xl,
        gap: spacing.sm,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Ionicons name={icon} size={26} color={colors.textInverse} />
      <Text variant="h2" tone="inverse">
        {title}
      </Text>
      <Text tone="inverse" style={{ opacity: 0.9 }}>
        {body}
      </Text>
    </Pressable>
  );
}

export default function CreateScreen() {
  const router = useRouter();
  return (
    <Screen scroll>
      <AppHeader
        title="Create"
        subtitle="Barter works when both sides list what they have and what they want."
      />
      <Stack gap="lg">
        <BigChoice
          tone="have"
          icon="cube-outline"
          title="I HAVE"
          body="A product, a service, or a skill you can offer in a trade."
          onPress={() => router.push('/(app)/new-listing')}
        />
        <BigChoice
          tone="need"
          icon="search-outline"
          title="I NEED"
          body="Something you're looking for. We'll find people who have it and want what you offer."
          onPress={() => router.push('/(app)/new-need')}
        />

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: spacing.lg,
            gap: spacing.xs,
            backgroundColor: colors.surface,
          }}
        >
          <Text variant="label" tone="secondary">
            HOW A BARTER MATCH HAPPENS
          </Text>
          <Text tone="secondary">
            You have <Text tone="accent">Web design</Text> and need{' '}
            <Text tone="need">Photography</Text>. Someone else has{' '}
            <Text tone="accent">Photography</Text> and needs <Text tone="need">Web design</Text>.
            PANDAM spots the mirror — no money changes hands.
          </Text>
        </View>
      </Stack>
    </Screen>
  );
}
