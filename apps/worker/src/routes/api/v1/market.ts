/**
 * `/api/v1/listings` ("I HAVE") and `/api/v1/needs` ("I NEED") — identical
 * shapes, one factory.
 *
 *   GET  /              public discovery of PUBLISHED items (filters + cursor)
 *   GET  /mine          the caller's own items, every status (auth)
 *   POST /              create — owner is always the session user (auth)
 *   GET  /:id           one item; drafts/paused visible only to the owner
 *   PATCH /:id          update fields (auth + ownership)
 *   POST /:id/status    change publication status (auth + ownership)
 *
 * There is NO price/buy/sell anywhere. Ownership always derives from the
 * verified session — a client can never pass an owner id.
 */
import {
  createListingSchema,
  createNeedSchema,
  discoverQuerySchema,
  setListingStatusSchema,
  updateListingSchema,
  updateNeedSchema,
} from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { decodeCursor, encodeCursor } from '../../../lib/cursor';
import { ApiError, sendOk } from '../../../lib/http';
import { toMarketItem } from '../../../lib/serialize';
import { parseBody, parseQuery } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

type Kind = 'listing' | 'need';

interface KindConfig {
  kind: Kind;
  createSchema: typeof createListingSchema;
  updateSchema: typeof updateListingSchema;
}

const CONFIG: Record<Kind, KindConfig> = {
  listing: {
    kind: 'listing',
    createSchema: createListingSchema,
    updateSchema: updateListingSchema,
  },
  need: { kind: 'need', createSchema: createNeedSchema, updateSchema: updateNeedSchema },
};

export function createMarketRoute(kind: Kind) {
  const cfg = CONFIG[kind];
  const route = new Hono<AppEnv>();

  const repo = (c: Context<AppEnv>) => {
    const { repos } = c.get('ctx');
    return kind === 'listing'
      ? {
          crud: repos.listings,
          discover: repos.market.discoverListings,
          mine: repos.market.listOwnerListings,
          one: repos.market.getListing,
        }
      : {
          crud: repos.needs,
          discover: repos.market.discoverNeeds,
          mine: repos.market.listOwnerNeeds,
          one: repos.market.getNeed,
        };
  };

  // Public discovery — auth is optional, only PUBLISHED rows are returned.
  route.get('/', authMiddleware, async (c) => {
    const q = parseQuery(c, discoverQuerySchema);
    const { discover } = repo(c);
    const items = await discover({
      categoryId: q.category,
      type: q.type,
      q: q.q,
      ownerId: q.owner,
      limit: q.limit + 1,
      cursor: decodeCursor(q.cursor),
    });
    const hasMore = items.length > q.limit;
    const page = hasMore ? items.slice(0, q.limit) : items;
    const last = page[page.length - 1];
    return sendOk(c, {
      items: page.map((r) => toMarketItem(r, cfg.kind)),
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
    });
  });

  route.get('/mine', authMiddleware, requireAuth, async (c) => {
    const { user } = getAuth(c);
    const rows = await repo(c).mine(user.id);
    return sendOk(c, { items: rows.map((r) => toMarketItem(r, cfg.kind)) });
  });

  route.post('/', authMiddleware, requireAuth, async (c) => {
    const { user } = getAuth(c);
    const input = await parseBody(c, cfg.createSchema);
    const { crud, one } = repo(c);
    const created = await crud.create({ ...input, ownerId: user.id });
    const withRefs = await one(created.id);
    if (!withRefs) throw new ApiError('internal_error', 'Created item could not be loaded.');
    return sendOk(c, { item: toMarketItem(withRefs, cfg.kind) }, 201);
  });

  route.get('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const row = await repo(c).one(id);
    if (!row) throw new ApiError('not_found', `That ${cfg.kind} does not exist.`);
    if (row.status !== 'published') {
      const auth = c.get('auth');
      if (!auth || auth.user.id !== row.ownerId) {
        throw new ApiError('not_found', `That ${cfg.kind} does not exist.`);
      }
    }
    return sendOk(c, { item: toMarketItem(row, cfg.kind) });
  });

  route.patch('/:id', authMiddleware, requireAuth, async (c) => {
    const { user } = getAuth(c);
    const id = c.req.param('id');
    const { crud, one } = repo(c);
    const current = await crud.findById(id);
    if (!current) throw new ApiError('not_found', `That ${cfg.kind} does not exist.`);
    if (current.ownerId !== user.id) {
      throw new ApiError('forbidden', `You can only edit your own ${cfg.kind}s.`);
    }
    const patch = await parseBody(c, cfg.updateSchema);
    await crud.update(id, patch);
    const withRefs = await one(id);
    return sendOk(c, { item: toMarketItem(withRefs!, cfg.kind) });
  });

  route.post('/:id/status', authMiddleware, requireAuth, async (c) => {
    const { user } = getAuth(c);
    const id = c.req.param('id');
    const { crud, one } = repo(c);
    const current = await crud.findById(id);
    if (!current) throw new ApiError('not_found', `That ${cfg.kind} does not exist.`);
    if (current.ownerId !== user.id) {
      throw new ApiError('forbidden', `You can only change your own ${cfg.kind}s.`);
    }
    const { status } = await parseBody(c, setListingStatusSchema);
    await crud.setStatus(id, status);
    const withRefs = await one(id);
    return sendOk(c, { item: toMarketItem(withRefs!, cfg.kind) });
  });

  return route;
}
