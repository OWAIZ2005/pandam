/**
 * The active identity-verification providers. To go live, implement the
 * interfaces in `./types` (e.g. `digiLockerProductionService`) and swap them
 * in here — no screen needs to change.
 */
import { type AuthenticatedUser } from '@pandam/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { authKeys } from '@/lib/auth/hooks';

import { digiLockerDemoService, faceVerificationDemoService } from './demo';

export type { FaceVerifier, GovernmentIdVerifier, VerificationStage } from './types';

export const governmentIdVerifier = digiLockerDemoService;
export const faceVerifier = faceVerificationDemoService;

/**
 * Write a provider result into the ONE session cache (`['auth','me']`). The
 * route guards read verification status from there, so this is all it takes
 * for the rest of the app to see the new state.
 */
export function useApplyVerification() {
  const qc = useQueryClient();
  return useCallback(
    (result: AuthenticatedUser) => qc.setQueryData<AuthenticatedUser>(authKeys.me, result),
    [qc],
  );
}
