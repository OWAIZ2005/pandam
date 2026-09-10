/**
 * Opaque keyset-pagination cursor: base64url of `<createdAt>.<id>`. The client
 * treats it as opaque and just passes it back as `?cursor=`.
 */
export interface Cursor {
  createdAt: number;
  id: string;
}

export function encodeCursor(c: Cursor): string {
  return btoa(`${c.createdAt}.${c.id}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCursor(raw: string | undefined): Cursor | undefined {
  if (!raw) return undefined;
  try {
    const text = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
    const dot = text.lastIndexOf('.');
    if (dot <= 0) return undefined;
    const createdAt = Number.parseInt(text.slice(0, dot), 10);
    const id = text.slice(dot + 1);
    if (!Number.isFinite(createdAt) || !id) return undefined;
    return { createdAt, id };
  } catch {
    return undefined;
  }
}
