import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Notice, Screen, Stack, Text, colors, layout, radii, spacing } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { CheckRow, StatusState, StepIcon } from '@/components/verification/parts';
import { useSession } from '@/lib/auth/hooks';
import {
  governmentIdVerifier,
  useApplyVerification,
  type VerificationStage,
} from '@/lib/verification';

type Step = 'intro' | 'consent' | 'working' | 'success' | 'cancelled' | 'failed';

/**
 * Government-ID verification via DigiLocker — DEMO.
 *
 * Deliberately PANDAM's own screens, not a copy of DigiLocker's UI: we explain
 * what will happen, ask for consent, then show progress. In production the
 * "Allow & Continue" step hands off to DigiLocker's real authorization page;
 * here the demo provider simulates it and says so on screen.
 */
export default function DigiLockerScreen() {
  const router = useRouter();
  const { user } = useSession();
  const apply = useApplyVerification();
  const alreadyDone = user?.identityVerification?.governmentId === 'verified';
  const [step, setStep] = useState<Step>(alreadyDone ? 'success' : 'intro');
  const [stage, setStage] = useState<VerificationStage>('connecting');

  const run = async () => {
    setStage('connecting');
    setStep('working');
    try {
      const result = await governmentIdVerifier.verify(setStage);
      apply(result);
      setStep('success');
    } catch {
      setStep('failed');
    }
  };

  const toHub = () => router.replace('/(onboarding)/verify');

  return (
    <Screen scroll padded={false} edges={['top', 'bottom']}>
      <View
        style={{
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: spacing.lg,
          paddingBottom: spacing['3xl'],
        }}
      >
        {step === 'intro' || step === 'consent' ? (
          <AppHeader title={step === 'intro' ? 'Verify with DigiLocker' : 'Authorization'} back />
        ) : null}

        {step === 'intro' ? (
          <Stack gap="xl">
            <StepIcon name="id-card-outline" />
            <Text variant="body" tone="secondary">
              Pandam uses DigiLocker to verify your identity using an eligible government-issued
              digital document.
            </Text>
            <Stack gap="md">
              <CheckRow icon="lock-closed">Secure verification</CheckRow>
              <CheckRow icon="hand-left">User-controlled consent</CheckRow>
              <CheckRow icon="checkmark-done">One-time verification</CheckRow>
            </Stack>
            <Notice
              kind="neutral"
              icon={<Ionicons name="lock-closed" size={16} color={colors.textMuted} />}
            >
              Your information is shared only with your consent and used only for verification.
            </Notice>
            <Button label="Continue" size="lg" fullWidth onPress={() => setStep('consent')} />
          </Stack>
        ) : null}

        {step === 'consent' ? (
          <Stack gap="xl">
            <Text variant="body" tone="secondary">
              Pandam is requesting permission to access the information required for identity
              verification.
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <Text variant="label" tone="secondary" style={{ fontWeight: '700' }}>
                Information requested
              </Text>
              <CheckRow icon="person-outline">Name</CheckRow>
              <CheckRow icon="calendar-outline">Date of Birth</CheckRow>
              <CheckRow icon="document-text-outline">Eligible Government ID information</CheckRow>
            </View>
            <Stack gap="sm">
              <Button label="Allow & Continue" size="lg" fullWidth onPress={() => void run()} />
              <Button
                label="Cancel"
                variant="quiet"
                size="lg"
                fullWidth
                onPress={() => setStep('cancelled')}
              />
            </Stack>
          </Stack>
        ) : null}

        {step === 'working' ? (
          <StatusState
            kind="working"
            title={stage === 'connecting' ? 'Connecting securely...' : 'Verifying your identity...'}
            body="This usually takes a few seconds."
          />
        ) : null}

        {step === 'success' ? (
          <StatusState kind="success" title="Identity Verified">
            <Button
              label="Continue to face verification"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(onboarding)/verify/face')}
            />
          </StatusState>
        ) : null}

        {step === 'cancelled' ? (
          <StatusState
            kind="problem"
            title="Verification cancelled"
            body="You can verify whenever you're ready. Nothing was shared."
          >
            <Button label="Try again" size="lg" fullWidth onPress={() => setStep('intro')} />
            <Button label="Back to verification" variant="quiet" fullWidth onPress={toHub} />
          </StatusState>
        ) : null}

        {step === 'failed' ? (
          <StatusState
            kind="problem"
            title="Something went wrong"
            body="We couldn't complete identity verification. Please try again."
          >
            <Button label="Try again" size="lg" fullWidth onPress={() => void run()} />
            <Button label="Back to verification" variant="quiet" fullWidth onPress={toHub} />
          </StatusState>
        ) : null}
      </View>
    </Screen>
  );
}
