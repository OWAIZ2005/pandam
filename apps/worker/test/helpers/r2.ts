/**
 * A minimal in-memory stand-in for an R2 bucket.
 *
 * Only the four operations the media code actually uses are implemented
 * (`put`, `get`, `delete`, `head`), which is enough to assert the real thing
 * the routes are responsible for: that bytes go in under a server-chosen key
 * and come back out through `GET /api/v1/media/:key`.
 */
interface StoredObject {
  bytes: ArrayBuffer;
  contentType: string;
}

export interface FakeBucket {
  bucket: R2Bucket;
  /** Every key currently stored — assertions read this directly. */
  keys: () => string[];
  size: () => number;
}

export function makeFakeBucket(): FakeBucket {
  const store = new Map<string, StoredObject>();

  const bucket = {
    async put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }) {
      store.set(key, {
        bytes: value,
        contentType: opts?.httpMetadata?.contentType ?? 'application/octet-stream',
      });
      return { key };
    },
    async get(key: string) {
      const found = store.get(key);
      if (!found) return null;
      return {
        body: new Blob([found.bytes]).stream(),
        httpEtag: `"${key}"`,
        writeHttpMetadata(headers: Headers) {
          headers.set('content-type', found.contentType);
        },
      };
    },
    async head(key: string) {
      return store.has(key) ? { key } : null;
    },
    async delete(key: string) {
      store.delete(key);
    },
  } as unknown as R2Bucket;

  return { bucket, keys: () => [...store.keys()], size: () => store.size };
}
