import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Row,
  Screen,
  Stack,
  Text,
  colors,
  layout,
  palette,
  radii,
  spacing,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { CheckRow, StatusState, StepIcon } from '@/components/verification/parts';
import { useSession } from '@/lib/auth/hooks';
import { faceVerifier, useApplyVerification } from '@/lib/verification';

type Step =
  'intro' | 'camera' | 'preview' | 'working' | 'success' | 'denied' | 'captureError' | 'failed';
type CamStage = 'position' | 'detected' | 'checking' | 'capturing';

const CAM_PROMPT: Record<CamStage, string> = {
  position: 'Position your face inside the frame',
  detected: 'Face detected',
  checking: 'Checking position',
  capturing: 'Capturing',
};

/**
 * Face verification — DEMO.
 *
 * Opens the FRONT camera with a face guide, walks through staged prompts, and
 * captures one frame. It does NOT detect faces, check liveness or match
 * biometrics — the prompts are timed, and the screen says "Demo". The photo
 * never leaves the device and is discarded after this screen.
 */
export default function FaceVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const apply = useApplyVerification();
  const [permission, requestPermission] = useCameraPermissions();
  const alreadyDone = user?.identityVerification?.face === 'verified';

  const [step, setStep] = useState<Step>(alreadyDone ? 'success' : 'intro');
  const [camStage, setCamStage] = useState<CamStage>('position');
  const [photo, setPhoto] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const camera = useRef<CameraView>(null);

  // Timed demo prompts, then capture. Restarts whenever the camera reopens.
  useEffect(() => {
    if (step !== 'camera' || !ready) return undefined;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(setTimeout(() => !cancelled && fn(), ms));
    at(1500, () => setCamStage('detected'));
    at(2500, () => setCamStage('checking'));
    at(3500, () => setCamStage('capturing'));
    at(3900, async () => {
      try {
        const pic = await camera.current?.takePictureAsync({ quality: 0.6 });
        if (cancelled) return;
        if (!pic?.uri) throw new Error('no image');
        setPhoto(pic.uri);
        setStep('preview');
      } catch {
        if (!cancelled) setStep('captureError');
      }
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [step, ready]);

  const openCamera = async () => {
    const granted = permission?.granted || (await requestPermission()).granted;
    if (!granted) {
      setStep('denied');
      return;
    }
    setCamStage('position');
    setReady(false);
    setPhoto(null);
    setStep('camera');
  };

  const submit = async () => {
    if (!photo) return;
    setStep('working');
    try {
      const result = await faceVerifier.submit(photo, () => undefined);
      apply(result);
      setPhoto(null); // discard the selfie
      setStep('success');
    } catch {
      setStep('failed');
    }
  };

  const toHub = () => router.replace('/(onboarding)/verify');
  const canAskAgain = permission?.canAskAgain !== false;

  /* ---------------------------------------------------------- camera -- */
  if (step === 'camera') {
    const good = camStage !== 'position';
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink }}>
        <CameraView
          ref={camera}
          facing="front"
          style={{ position: 'absolute', inset: 0 }}
          onCameraReady={() => setReady(true)}
          onMountError={() => setStep('captureError')}
        />
        {/* dim the edges so the face guide reads */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,14,10,0.35)' }}
        />

        <View
          style={{
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: layout.gutter,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            onPress={() => setStep('intro')}
            hitSlop={10}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={22} color={palette.white} />
          </Pressable>
          <Text style={{ color: palette.white, fontWeight: '700', fontSize: 15 }}>
            Face Verification
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          pointerEvents="none"
        >
          <View
            style={{
              width: 240,
              height: 310,
              borderRadius: 150,
              borderWidth: 4,
              borderColor: good ? colors.matchBright : 'rgba(255,255,255,0.85)',
            }}
          />
        </View>

        <View
          style={{
            paddingBottom: insets.bottom + spacing['2xl'],
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: 'rgba(20,14,10,0.7)',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.pill,
            }}
            accessibilityLiveRegion="polite"
          >
            <Ionicons
              name={good ? 'checkmark-circle' : 'scan-outline'}
              size={18}
              color={good ? colors.matchBright : palette.white}
            />
            <Text style={{ color: palette.white, fontWeight: '600' }}>
              {ready ? CAM_PROMPT[camStage] : 'Starting camera…'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /* ------------------------------------------------------------- rest -- */
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
        {step === 'intro' ? (
          <Stack gap="xl">
            <AppHeader title="Face Verification" back />
            <StepIcon name="scan-outline" />
            <Text variant="body" tone="secondary">
              We&apos;ll use your device camera to capture your face.
            </Text>
            <Stack gap="md">
              <CheckRow icon="happy-outline">Keep your face clearly visible</CheckRow>
              <CheckRow icon="sunny-outline">Use a well-lit environment</CheckRow>
              <CheckRow icon="glasses-outline">Remove anything covering your face</CheckRow>
              <CheckRow icon="scan-outline">Position your face inside the frame</CheckRow>
            </Stack>
            <Text variant="caption" tone="muted">
              Your photo is used only for this verification.
            </Text>
            <Button
              label="Start Face Verification"
              size="lg"
              fullWidth
              onPress={() => void openCamera()}
            />
          </Stack>
        ) : null}

        {step === 'preview' && photo ? (
          <Stack gap="xl" align="center">
            <AppHeader title="Check your photo" />
            <Image
              source={{ uri: photo }}
              style={{
                width: 240,
                height: 310,
                borderRadius: 150,
                backgroundColor: colors.surfaceMuted,
              }}
              resizeMode="cover"
              accessibilityLabel="Your captured selfie"
            />
            <Text variant="bodySm" tone="secondary" center>
              Make sure your whole face is visible and in focus.
            </Text>
            <Row gap="md" style={{ alignSelf: 'stretch' }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Retake"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onPress={() => void openCamera()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Continue" size="lg" fullWidth onPress={() => void submit()} />
              </View>
            </Row>
          </Stack>
        ) : null}

        {step === 'working' ? (
          <StatusState
            kind="working"
            title="Verifying..."
            body="This usually takes a few seconds."
          />
        ) : null}

        {step === 'success' ? (
          <StatusState kind="success" title="Face Verification Complete">
            <Button
              label="Continue"
              size="lg"
              fullWidth
              onPress={() =>
                router.replace(
                  user?.identityVerification?.status === 'verified'
                    ? '/(onboarding)/verify/complete'
                    : '/(onboarding)/verify',
                )
              }
            />
          </StatusState>
        ) : null}

        {step === 'denied' ? (
          <StatusState
            kind="problem"
            title="Camera access needed"
            body="Camera access is required for face verification."
          >
            {canAskAgain || Platform.OS === 'web' ? (
              <Button label="Allow camera" size="lg" fullWidth onPress={() => void openCamera()} />
            ) : (
              <Button
                label="Open settings"
                size="lg"
                fullWidth
                onPress={() => void Linking.openSettings()}
              />
            )}
            <Button label="Back to verification" variant="quiet" fullWidth onPress={toHub} />
          </StatusState>
        ) : null}

        {step === 'captureError' ? (
          <StatusState
            kind="problem"
            title="Couldn't capture"
            body="We couldn't capture your face clearly. Please try again."
          >
            <Button label="Try again" size="lg" fullWidth onPress={() => void openCamera()} />
            <Button label="Back to verification" variant="quiet" fullWidth onPress={toHub} />
          </StatusState>
        ) : null}

        {step === 'failed' ? (
          <StatusState
            kind="problem"
            title="Something went wrong"
            body="We couldn't complete face verification. Please try again."
          >
            <Button label="Try again" size="lg" fullWidth onPress={() => void submit()} />
            <Button
              label="Retake photo"
              variant="quiet"
              fullWidth
              onPress={() => void openCamera()}
            />
          </StatusState>
        ) : null}
      </View>
    </Screen>
  );
}
