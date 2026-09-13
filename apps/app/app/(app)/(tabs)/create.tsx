import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card, Divider, Row, Screen, Stack, Text, colors, radii, spacing } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';

/**
 * One of the two things you can add.
 *
 * Previously a full-bleed gradient card with a 140px watermark icon behind
 * the text. The decision here is genuinely binary and genuinely important, so
 * the card is given real presence — but through size, spacing and a single
 * coloured edge rather than through a coloured slab. What it is for is now
 * readable in one pass instead of competing with its own background.
 */
function BigChoice({
  edge,
  icon,
  title,
  body,
  examples,
  onPress,
}: {
  edge: 'accent' | 'need';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  examples: string[];
  onPress: () => void;
}) {
  const color = edge === 'accent' ? colors.accent : colors.need;
  const tint = edge === 'accent' ? colors.accentSoft : colors.needSoft;
  const border = edge === 'accent' ? colors.accentBorder : colors.needBorder;

  return (
    <Card onPress={onPress} accessibilityLabel={title} edge={edge} padded={false}>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Row justify="space-between" align="flex-start">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.md,
              backgroundColor: tint,
              borderWidth: 1,
              borderColor: border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Ionicons name="arrow-forward" size={17} color={colors.textFaint} />
        </Row>

        <View style={{ gap: spacing.xs }}>
          <Text variant="h1">{title}</Text>
          <Text variant="bodySm" tone="secondary">
            {body}
          </Text>
        </View>

        {/* Examples as plain text, not as pill badges. Three pills for three
            nouns reads as a feature list on a pricing page; a quiet line of
            examples reads as help. */}
        <Text variant="caption" tone="muted">
          {examples.join(' · ')}
        </Text>
      </View>
    </Card>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <Row gap="md" align="flex-start">
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: colors.matchBorder,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="caption" numeric style={{ color: colors.matchText, fontWeight: '600' }}>
          {n}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="bodySm" tone="secondary">
          {body}
        </Text>
      </View>
    </Row>
  );
}

export default function CreateScreen() {
  const router = useRouter();

  return (
    <Screen scroll tabBarInset>
      <AppHeader
        title="Add to the marketplace"
        subtitle="Barter works when both sides list what they have and what they want."
      />

      <Stack gap="xl">
        <BigChoice
          edge="accent"
          icon="cube-outline"
          title="I have"
          body="Something you can put on the table — an object, your time, or a skill."
          examples={['A camera', 'Two hours of tutoring', 'Logo design']}
          onPress={() => router.push('/(app)/new-listing')}
        />

        <BigChoice
          edge="need"
          icon="search-outline"
          title="I need"
          body="Something you are looking for. We watch for people who have it and want what you offer."
          examples={['A bike repair', 'Wedding photos', 'Help moving flat']}
          onPress={() => router.push('/(app)/new-need')}
        />

        <Card padded>
          <Stack gap="lg">
            <Row gap="sm">
              <Ionicons name="sparkles" size={15} color={colors.match} />
              <Text variant="label" tone="match">
                How a barter match happens
              </Text>
            </Row>

            <Divider tone="soft" />

            <Stack gap="lg">
              <Step
                n={1}
                title="You list both sides"
                body="What you can offer, and what you are after."
              />
              <Step
                n={2}
                title="We look for the mirror"
                body="Someone who has what you need and needs what you have."
              />
              <Step
                n={3}
                title="You trade directly"
                body="Goods for goods. No money, no credits, no wallet."
              />
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}
