/**
 * `/api/v1/media` — reads objects back out of the R2 media bucket.
 *
 *   GET /*   stream one object by its key
 *
 * Deliberately unauthenticated and cacheable: these are listing photos and
 * avatars, i.e. content already visible to anyone who can see the listing.
 * Keys are server-generated random ids, never guessable identifiers, and
 * nothing else is ever written to this bucket — so there is nothing private
 * here to leak. Writes live next to the entity they belong to (listing images
 * on `/listings/:id/images`, avatars on `/profiles/me/avatar`).
 */
import { Hono } from 'hono';

import { ApiError } from '../../../lib/http';
import { type AppEnv } from '../../../types';

export const mediaRoute = new Hono<AppEnv>();

mediaRoute.get('/*', async (c) => {
  if (!c.env.MEDIA) throw new ApiError('db_unavailable', 'Image storage is not configured.');

  // Everything after `/api/v1/media/` is the object key; it may contain `/`.
  const key = decodeURIComponent(c.req.path.replace(/^\/api\/v1\/media\//, ''));
  if (!key || key.includes('..')) throw new ApiError('not_found', 'That image does not exist.');

  const object = await c.env.MEDIA.get(key);
  if (!object) throw new ApiError('not_found', 'That image does not exist.');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Keys are content-addressed by a random id and objects are never mutated in
  // place, so a long immutable cache is safe.
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
});
