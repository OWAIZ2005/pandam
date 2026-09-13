/**
 * Image upload and URL resolution.
 *
 * The API returns image paths relative to its own origin (`/api/v1/media/…`)
 * so the same row works across local, preview and production deployments.
 * `mediaSrc` is the single place that turns one into something an `<Image>`
 * can fetch — screens must never concatenate that themselves.
 */
import { type ItemImage, type PublicProfile } from '@pandam/types';

import { clientEnv } from '@/lib/env';

import { api } from './client';

/** Absolute URL for an API-relative media path. Passes through absolute URLs. */
export function mediaSrc(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${clientEnv.apiUrl}${path}`;
}

/** The photo a card should show, or `undefined` when the item has none. */
export function primaryImage(images: ItemImage[] | undefined): string | undefined {
  return mediaSrc(images?.[0]?.url);
}

/**
 * Wrap a local file URI as multipart form data.
 *
 * React Native's `FormData` accepts this `{ uri, name, type }` shape directly
 * and streams the file without loading it into JS memory — the reason uploads
 * go through multipart rather than a base64 JSON body. On web the picker hands
 * back a `blob:`/`data:` URL, which has to be fetched into a real `Blob`
 * first, so the two platforms genuinely need different paths here.
 */
async function imageForm(uri: string): Promise<FormData> {
  const form = new FormData();
  const name = uri.split('/').pop()?.split('?')[0] || 'photo.jpg';
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : 'jpg';
  const type =
    extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  if (uri.startsWith('blob:') || uri.startsWith('data:')) {
    const blob = await fetch(uri).then((r) => r.blob());
    form.append('file', new File([blob], name, { type: blob.type || type }));
    return form;
  }

  // Native: the platform resolves the `file://` URI when the request is sent.
  form.append('file', { uri, name, type } as unknown as Blob);
  return form;
}

export const mediaApi = {
  /** Attach one photo to a listing. Returns the stored image. */
  uploadListingImage: async (listingId: string, uri: string) =>
    api.upload<{ image: ItemImage }>(`/api/v1/listings/${listingId}/images`, await imageForm(uri)),

  deleteListingImage: (listingId: string, imageId: string) =>
    api.delete<{ deleted: true }>(`/api/v1/listings/${listingId}/images/${imageId}`),

  uploadAvatar: async (uri: string) =>
    api.upload<{ profile: PublicProfile }>('/api/v1/profiles/me/avatar', await imageForm(uri)),
};
