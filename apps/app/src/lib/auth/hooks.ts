/**
 * Auth state for the client.
 *
 * The source of truth is a single TanStack Query cache entry (`['auth','me']`):
 *  - `undefined` + `isPending` → still resolving (show a splash, never a route)
 *  - `null`                    → not authenticated
 *  - `AuthenticatedUser`       → authenticated
 *
 * Mutations (`useLogin` / `useRegister` / `useLogout`) update that entry and the
 * native secure-store token. No Zustand — this is server state and belongs in
 * the query cache.
 */
import { type AuthenticatedUser } from '@pandam/types';
import { type LoginInput, type RegisterInput } from '@pandam/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { unregisterPushToken } from '@/lib/push/token';
import { sessionToken } from '@/lib/session/storage';

export const authKeys = { me: ['auth', 'me'] as const };

async function fetchMe(): Promise<AuthenticatedUser | null> {
  try {
    return await authApi.me();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function useSession() {
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
  });
  return {
    ...query,
    user: query.data?.user ?? null,
    profile: query.data?.profile ?? null,
    isAuthenticated: !!query.data,
    /** True until the first `me` resolution — routes must wait for this. */
    isResolving: query.isPending,
  };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async (s) => {
      await sessionToken.set(s.token);
      qc.setQueryData<AuthenticatedUser>(authKeys.me, { user: s.user, profile: s.profile });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: async (s) => {
      await sessionToken.set(s.token);
      qc.setQueryData<AuthenticatedUser>(authKeys.me, { user: s.user, profile: s.profile });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Unregister first, while the session is still valid — afterwards the
      // request would be rejected and this phone would keep getting pushes
      // meant for the account that just signed out.
      await unregisterPushToken();
      return authApi.logout();
    },
    onSettled: async () => {
      await sessionToken.clear();
      qc.setQueryData(authKeys.me, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    },
  });
}
