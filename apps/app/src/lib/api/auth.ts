/**
 * Auth API calls. Thin wrappers over the shared client so hooks stay readable.
 * Input shapes come from `@pandam/validation` and response shapes from
 * `@pandam/types` — the exact same definitions the Worker uses.
 */
import { type AuthSession, type AuthenticatedUser } from '@pandam/types';
import { type LoginInput, type RegisterInput } from '@pandam/validation';

import { api } from './client';

export const authApi = {
  register: (input: RegisterInput) => api.post<AuthSession>('/api/v1/auth/register', input),
  login: (input: LoginInput) => api.post<AuthSession>('/api/v1/auth/login', input),
  logout: () => api.post<{ loggedOut: boolean }>('/api/v1/auth/logout'),
  me: () => api.get<AuthenticatedUser>('/api/v1/auth/me'),
};
