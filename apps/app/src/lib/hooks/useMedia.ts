/**
 * Photo upload mutations.
 *
 * Uploads are sequential rather than parallel (`for … await`): a phone on a
 * weak connection sending six full-resolution photos at once tends to time
 * the whole batch out, and a partial failure is much easier to report when
 * you know exactly how many got through.
 */
import { type AuthenticatedUser, type ItemImage } from '@pandam/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { mediaApi } from '@/lib/api/media';
import { authKeys } from '@/lib/auth/hooks';
import { qk } from '@/lib/query/keys';

/** Upload several local photos to one listing, reporting how many landed. */
export function useUploadListingImages() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, uris }: { listingId: string; uris: string[] }) => {
      const uploaded: ItemImage[] = [];
      for (const uri of uris) {
        const { image } = await mediaApi.uploadListingImage(listingId, uri);
        uploaded.push(image);
      }
      return uploaded;
    },
    onSuccess: (_images, { listingId }) => {
      void client.invalidateQueries({ queryKey: qk.market.detail('listing', listingId) });
      void client.invalidateQueries({ queryKey: qk.market.all('listing') });
    },
  });
}

export function useDeleteListingImage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, imageId }: { listingId: string; imageId: string }) =>
      mediaApi.deleteListingImage(listingId, imageId),
    onSuccess: (_res, { listingId }) => {
      void client.invalidateQueries({ queryKey: qk.market.detail('listing', listingId) });
      void client.invalidateQueries({ queryKey: qk.market.all('listing') });
    },
  });
}

export function useUploadAvatar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => mediaApi.uploadAvatar(uri),
    onSuccess: ({ profile }) => {
      // Write straight into the cached session so the new face appears
      // everywhere at once instead of after the next refetch.
      client.setQueryData<AuthenticatedUser>(authKeys.me, (prev) =>
        prev ? { ...prev, profile } : prev,
      );
      void client.invalidateQueries({ queryKey: qk.market.all('listing') });
    },
  });
}
