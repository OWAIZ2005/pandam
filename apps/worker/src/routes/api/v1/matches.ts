/**
 * `/api/v1/matches` — deterministic reciprocal barter candidates for the
 * current user. Proves the matching domain module is wired to the repositories.
 * Read-only; requires an authenticated user (dev header in non-production).
 */
import { Hono } from 'hono';

import { buildContext, requireUserId } from '../../../context';
import { findReciprocalMatches, type MarketItem } from '../../../domain/matching';
import { type AppBindings } from '../../../env';
import { sendOk } from '../../../lib/http';

export const matchesRoute = new Hono<AppBindings>();

matchesRoute.get('/', async (c) => {
  const userId = requireUserId(c);
  const ctx = buildContext(c);

  const [listings, needs] = await Promise.all([
    ctx.repos.listings.listAllPublished(),
    ctx.repos.needs.listAllPublished(),
  ]);

  const toItem = (r: {
    id: string;
    ownerId: string;
    categoryId: string;
    type: MarketItem['type'];
  }): MarketItem => ({
    id: r.id,
    ownerId: r.ownerId,
    categoryId: r.categoryId,
    type: r.type,
  });

  const all = findReciprocalMatches(listings.map(toItem), needs.map(toItem));
  const mine = all.filter((m) => m.userAId === userId || m.userBId === userId);

  return sendOk(c, { matches: mine, totalConsidered: all.length });
});
