import { type AuthenticatedUser } from '@pandam/types';
import { type PatchProfileInput } from '@pandam/validation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileApi } from '@/lib/api/profile';

import { authKeys } from './hooks';

/** Update the signed-in user's profile and refresh the cached `me` entry. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatchProfileInput) => profileApi.patch(input),
    onSuccess: ({ profile }) => {
      qc.setQueryData<AuthenticatedUser>(authKeys.me, (prev) =>
        prev ? { ...prev, profile } : prev,
      );
    },
  });
}
