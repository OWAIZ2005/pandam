/**
 * First-time identity verification — the account-side record of it.
 *
 * Two steps, in order: a government-ID check (DigiLocker in production) and a
 * face check. Only OUTCOMES are stored on the user (timestamps + an overall
 * status); no ID number, document, OTP or image ever reaches this service.
 *
 * DEMO ONLY TODAY: `mode: 'demo'` simply records the step as passed, because
 * no real provider is connected. It is refused when PANDAM_ENV is
 * `production`, so a demo can never mark a real account verified. A
 * production provider plugs in here: verify with the provider server-side,
 * then call the same `recordStep` — the screens and the user record do not
 * change.
 */
import { type Repositories, type UserRow } from '@pandam/database';

import { ApiError } from '../lib/http';

export type VerificationStep = 'governmentId' | 'face';

export function createVerificationService(repos: Repositories, opts: { demoAllowed: boolean }) {
  return {
    async recordStep(user: UserRow, step: VerificationStep): Promise<UserRow> {
      if (!opts.demoAllowed) {
        throw new ApiError(
          'not_implemented',
          'Identity verification is not connected to a production provider yet.',
        );
      }
      if (user.identityVerificationStatus === 'verified') return user; // idempotent

      const now = Date.now();
      if (step === 'face' && !user.governmentIdVerifiedAt) {
        throw new ApiError('conflict', 'Verify your government ID before face verification.');
      }

      const governmentIdVerifiedAt =
        step === 'governmentId'
          ? (user.governmentIdVerifiedAt ?? now)
          : user.governmentIdVerifiedAt;
      const faceVerifiedAt = step === 'face' ? (user.faceVerifiedAt ?? now) : user.faceVerifiedAt;

      const updated = await repos.users.setIdentityVerification(user.id, {
        identityVerificationStatus:
          governmentIdVerifiedAt && faceVerifiedAt ? 'verified' : 'in_progress',
        ...(governmentIdVerifiedAt ? { governmentIdVerifiedAt } : {}),
        ...(faceVerifiedAt ? { faceVerifiedAt } : {}),
      });
      if (!updated) throw new ApiError('not_found', 'Account not found.');
      return updated;
    },
  };
}
