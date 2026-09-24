/**
 * Identity-verification API calls. Both return the same `AuthenticatedUser`
 * shape as `GET /auth/me`, so callers write the result straight into the
 * single session cache — there is no separate verification store.
 */
import { type AuthenticatedUser } from '@pandam/types';
import { type VerificationStepInput } from '@pandam/validation';

import { api } from './client';

export const verificationApi = {
  governmentId: (input: VerificationStepInput) =>
    api.post<AuthenticatedUser>('/api/v1/verification/government-id', input),
  face: (input: VerificationStepInput) =>
    api.post<AuthenticatedUser>('/api/v1/verification/face', input),
};
