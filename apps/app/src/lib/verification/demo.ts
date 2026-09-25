/**
 * DEMO providers. Nothing here talks to DigiLocker, UIDAI, API Setu or any
 * biometric service, and no identity data is collected: each simply waits a
 * realistic moment and then records the step via the Worker's demo endpoint
 * (which is refused in production — see apps/worker/src/services/verification.ts).
 */
import { verificationApi } from '@/lib/api/verification';

import { type FaceVerifier, type GovernmentIdVerifier } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const digiLockerDemoService: GovernmentIdVerifier = {
  isDemo: true,
  async verify(onStage) {
    onStage('connecting');
    await wait(1300);
    onStage('verifying');
    await wait(1500);
    return verificationApi.governmentId({ mode: 'demo' });
  },
};

export const faceVerificationDemoService: FaceVerifier = {
  isDemo: true,
  async submit(_photoUri, onStage) {
    // The captured photo stays on the device and is discarded — never sent.
    onStage('verifying');
    await wait(1600);
    return verificationApi.face({ mode: 'demo' });
  },
};
