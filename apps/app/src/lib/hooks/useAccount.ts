/**
 * Account hooks: devices, password rotation, deletion.
 *
 * Anything that ends the current session also clears the local token and the
 * cached `me` entry, so the app falls back to the auth screens the same way a
 * normal sign-out does rather than sitting on a dead session.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChangePasswordInput, type DeleteAccountInput } from '@pandam/validation';

import { accountApi } from '@/lib/api/account';
import { authKeys } from '@/lib/auth/hooks';
import { qk } from '@/lib/query/keys';
import { sessionToken } from '@/lib/session/storage';

export function useSessions() {
  return useQuery({
    queryKey: qk.account.sessions,
    queryFn: async () => (await accountApi.sessions()).items,
    staleTime: 15_000,
  });
}

export function useRevokeSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountApi.revokeSession(id),
    onSuccess: async (res) => {
      if (res.wasCurrent) {
        // Signing out the device you are holding is a logout.
        await sessionToken.clear();
        client.setQueryData(authKeys.me, null);
        client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
        return;
      }
      void client.invalidateQueries({ queryKey: qk.account.sessions });
    },
  });
}

export function useRevokeOtherSessions() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => accountApi.revokeOtherSessions(),
    onSuccess: () => void client.invalidateQueries({ queryKey: qk.account.sessions }),
  });
}

export function useChangePassword() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => accountApi.changePassword(input),
    // The current session survives a password change by design, so the user
    // stays where they are; only the device list needs refreshing.
    onSuccess: () => void client.invalidateQueries({ queryKey: qk.account.sessions }),
  });
}

export function useDeleteAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteAccountInput) => accountApi.deleteAccount(input),
    onSuccess: async () => {
      await sessionToken.clear();
      client.setQueryData(authKeys.me, null);
      client.clear();
    },
  });
}
