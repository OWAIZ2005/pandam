import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Row, Screen, Stack, Text, colors, layout, radii, spacing } from '@pandam/ui';

import { StepProgress } from '@/components/verification/parts';
import { useSession } from '@/lib/auth/hooks';

function Verified({ label, value = 'Verified' }: { label: string; value?: string }) {
  return (
    <Row justify="space-between" align="center" style={{ paddingVertical: spacing.sm }}>
      <Row gap="sm" align="center">
        <Ionicons name="checkmark-circle" size={20} color={colors.match} />
        <Text variant="bodyStrong">{label}</Text>
      </Row>
      <Text variant="label" tone="match" style={{ fontWeight: '700' }}>
        {value}
      </Text>
    </Row>
  );
}

/** "Identity Verification Complete" — the last onboarding step before Home. */
export default function VerificationCompleteScreen() {
  const router = useRouter();
  const { user } = useSession();
  if (user?.identityVerification?.status !== 'verified') {
    return <Redirect href="/(onboarding)/verify" />;
  }

  return (
    <Screen scroll padded={false} edges={['top', 'bottom']}>
      <View
        style={{
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing.xl,
          paddingBottom: spacing['3xl'],
        }}
      >
        <Stack gap="xl">
          <StepProgress current="complete" />
          <Stack gap="md" align="center" style={{ paddingTop: spacing.lg }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: colors.match,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={42} color={colors.textInverse} />
            </View>
            <Text variant="display" center>
              Identity Verification Complete
            </Text>
            <Text variant="body" tone="secondary" center>
              Your Pandam account is now verified.
            </Text>
          </Stack>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.matchBorder,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            <Verified label="Government ID" />
            <Verified label="Face Verification" />
            {/* PANDAM has no phone number / phone verification, so we do not claim one. */}
            <Verified label="Account" value="Active" />
          </View>

          <Button
            label="Continue to Pandam"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(app)/(tabs)')}
          />
        </Stack>
      </View>
    </Screen>
  );
}
