/**
 * The contract every identity-verification provider implements. Screens only
 * ever talk to these interfaces (via `@/lib/verification`), so swapping the
 * demo services for production ones is a one-line change in `index.ts` — the
 * UI does not change.
 */
import { type AuthenticatedUser } from '@pandam/types';

/** Stages the UI shows while a provider is working. */
export type VerificationStage = 'connecting' | 'verifying';

export interface GovernmentIdVerifier {
  /** True while this is a simulation — the UI labels itself accordingly. */
  readonly isDemo: boolean;
  /**
   * Run the provider flow AFTER the user has given consent on our screen.
   * Resolves with the updated session user; throws on failure.
   *
   * Production (DigiLocker): open DigiLocker's own authorization in the
   * system browser, receive the authorization code, and send ONLY that code
   * to the Worker, which exchanges and verifies it server-side.
   */
  verify(onStage: (stage: VerificationStage) => void): Promise<AuthenticatedUser>;
}

export interface FaceVerifier {
  readonly isDemo: boolean;
  /**
   * Submit a captured selfie. Resolves with the updated session user.
   *
   * Production: upload to a liveness/face-match provider from the Worker.
   * The demo NEVER uploads or stores the photo.
   */
  submit(photoUri: string, onStage: (stage: VerificationStage) => void): Promise<AuthenticatedUser>;
}
