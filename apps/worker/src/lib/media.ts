/**
 * Image upload helpers for the R2 media bucket.
 *
 * Everything user-uploaded goes through here so the rules live in one place:
 * a strict content-type allowlist, a hard size cap, and a server-generated
 * object key. The client never chooses the key — it only ever sends bytes —
 * so a caller cannot overwrite somebody else's object or escape its prefix.
 */
import { ApiError } from './http';

/** Content types we accept, mapped to the extension used in the object key. */
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** 8 MB. Phone cameras exceed this only for uncompressed originals. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface UploadedImage {
  bytes: ArrayBuffer;
  contentType: string;
  extension: string;
}

/**
 * Pull a single image out of a `multipart/form-data` body under the field
 * `file`. Multipart (rather than a raw binary body) is what React Native's
 * `FormData` can send for a `file://` URI on both native and web without any
 * extra filesystem dependency.
 */
export async function readUploadedImage(request: Request): Promise<UploadedImage> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError('bad_request', 'Expected a multipart/form-data body with a `file` field.');
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new ApiError('validation_error', 'No image was uploaded.', { file: ['is required'] });
  }

  // `File.type` is attacker-controlled, so it is only used to pick the stored
  // content type from the allowlist — never trusted as proof of the format.
  const extension = ALLOWED[file.type.toLowerCase()];
  if (!extension) {
    throw new ApiError('unprocessable', 'Images must be JPEG, PNG, WebP or HEIC.', {
      file: ['unsupported image type'],
    });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ApiError('unprocessable', 'Images must be 8 MB or smaller.', {
      file: ['too large'],
    });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new ApiError('unprocessable', 'That image file was empty.', { file: ['is empty'] });
  }
  return { bytes, contentType: file.type.toLowerCase(), extension };
}

/** The R2 bucket, or a clear 503 when the binding is not configured. */
export function requireMedia(env: { MEDIA?: R2Bucket }): R2Bucket {
  if (!env.MEDIA) {
    throw new ApiError(
      'db_unavailable',
      'Image storage is not configured on this server (the MEDIA R2 binding is missing).',
    );
  }
  return env.MEDIA;
}

/**
 * Public path the app fetches an object back through. Relative on purpose —
 * the client already knows the API origin, and hardcoding one here would
 * break preview deployments.
 */
export function mediaUrl(objectKey: string): string {
  return `/api/v1/media/${objectKey}`;
}
