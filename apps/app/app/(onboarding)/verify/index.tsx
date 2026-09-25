import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  Button,
  Row,
  Screen,
  Stack,
  Text,
  colors,
  layout,
  radii,
  shadows,
  spacing,
} from '@pandam/ui';

import { StepProgress } from '@/components/verification/parts';
import { useLogout, useSession } from '@/lib/auth/hooks';

type IconName = keyof typeof Ionicons.glyphMap;

function StepCard({
  icon,
  title,
  description,
  done,
  locked,
  lockedHint,
  actionLabel,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  done: boolean;
  locked?: boolean;
  lockedHint?: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: done ? colors.matchBorder : colors.border,
        padding: spacing.lg,
        gap: spacing.md,
        ...shadows.xs,
      }}
    >
      <Row gap="md" align="flex-start">
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: done ? colors.matchSoft : colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={22} color={done ? colors.match : colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Row justify="space-between" align="center" gap="sm">
            <Text variant="h3" style={{ flexShrink: 1 }}>
              {title}
            </Text>
            {done ? (
              <Row gap="xs" align="center">
                <Ionicons name="checkmark-circle" size={16} color={colors.match} />
                <Text variant="caption" tone="match" style={{ fontWeight: '700' }}>
                  Verified
                </Text>
              </Row>
            ) : null}
          </Row>
          <Text variant="bodySm" tone="secondary">
            {description}
          </Text>
        </View>
      </Row>
      {done ? null : (
        <Stack gap="xs">
          <Button label={actionLabel} fullWidth disabled={locked} onPress={onPress} />
          {locked && lockedHint ? (
            <Text variant="caption" tone="muted" center>
              {lockedHint}
            </Text>
          ) : null}
        </Stack>
      )}
    </View>
  );
}

/**
 * "Verify Your Identity" — the one-time onboarding hub. It reads each step's
 * status from the session, so leaving and coming back (even after logging out
 * and in again) resumes exactly where the user stopped.
 */
export default function VerifyIdentityScreen() {
  const router = useRouter();
  const { user } = useSession();
  const logout = useLogout();
  const v = user?.identityVerification;
  const govDone = v?.governmentId === 'verified';
  const faceDone = v?.face === 'verified';
  const allDone = govDone && faceDone;

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
          <Stack gap="xs">
            <Text variant="display">Verify Your Identity</Text>
            <Text variant="body" tone="secondary">
              Complete a one-time identity verification to start using Pandam.
            </Text>
          </Stack>

          <StepProgress current={allDone ? 'complete' : 'identity'} />

          <StepCard
            icon="id-card-outline"
            title="Government ID"
            description="Verify your identity using DigiLocker."
            done={govDone}
            actionLabel="Verify with DigiLocker"
            onPress={() => router.push('/(onboarding)/verify/digilocker')}
          />
          <StepCard
            icon="scan-outline"
            title="Face Verification"
            description="Take a quick selfie using your device camera."
            done={faceDone}
            locked={!govDone}
            lockedHint="Complete Government ID first."
            actionLabel="Verify My Face"
            onPress={() => router.push('/(onboarding)/verify/face')}
          />

          {allDone ? (
            <Button
              label="Continue"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(onboarding)/verify/complete')}
            />
          ) : null}

          <Row gap="xs" justify="center" style={{ flexWrap: 'wrap' }}>
            <Text variant="caption" tone="muted">
              Signed in as {user?.email}.
            </Text>
            <Text
              variant="caption"
              tone="accent"
              style={{ fontWeight: '700' }}
              onPress={() =>
                logout.mutate(undefined, { onSettled: () => router.replace('/(auth)/login') })
              }
            >
              Sign out
            </Text>
          </Row>
        </Stack>
      </View>
    </Screen>
  );
}
