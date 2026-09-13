/**
 * Account management (`/api/v1/users/me`): devices, password, deletion.
 *
 * Every destructive call carries the current password. That is the server's
 * rule, not a UI nicety — a stolen session token must not be enough to lock
 * the real owner out.
 */
import { type ChangePasswordInput, type DeleteAccountInput } from '@pandam/validation';

import { api } from './client';

/** One signed-in device, as shown on the account screen. */
export interface SessionView {
  id: string;
  current: boolean;
  userAgent: string | null;
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number;
  active: boolean;
}

export const accountApi = {
  sessions: () => api.get<{ items: SessionView[] }>('/api/v1/users/me/sessions'),

  revokeSession: (id: string) =>
    api.delete<{ revoked: true; wasCurrent: boolean }>(`/api/v1/users/me/sessions/${id}`),

  revokeOtherSessions: () =>
    api.post<{ revoked: number }>('/api/v1/users/me/sessions/revoke-others'),

  changePassword: (input: ChangePasswordInput) =>
    api.post<{ changed: true; otherSessionsRevoked: number }>(
      '/api/v1/users/me/change-password',
      input,
    ),

  deleteAccount: (input: DeleteAccountInput) =>
    api.delete<{ deleted: true }>('/api/v1/users/me', input),
};
