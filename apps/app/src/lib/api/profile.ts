import { type PublicProfile } from '@pandam/types';
import { type PatchProfileInput, type PutProfileInput } from '@pandam/validation';

import { api } from './client';

export const profileApi = {
  get: () => api.get<{ profile: PublicProfile | null }>('/api/v1/profiles/me'),
  put: (input: PutProfileInput) =>
    api.put<{ profile: PublicProfile }>('/api/v1/profiles/me', input),
  patch: (input: PatchProfileInput) =>
    api.patch<{ profile: PublicProfile }>('/api/v1/profiles/me', input),
};
