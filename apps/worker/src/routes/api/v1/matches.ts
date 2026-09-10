/**
 * `/api/v1/matches` — deterministic reciprocal barter candidates for the
 * authenticated user. Read-only. The user id comes from the verified session,
 * never from the request, so a caller cannot list another user's matches.
 */
import { Hono } from 'hono';

import { findReciprocalMatches, type MarketItem } from '../../../domain/matching';
import { sendOk } from '../../../lib/http';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

export const matchesRoute = new Hono<AppEnv>();

matchesRoute.get('/', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');

  const [listings, needs] = await Promise.all([
    repos.listings.listAllPublished(),
    repos.needs.listAllPublished(),
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
  const mine = all.filter((m) => m.userAId === user.id || m.userBId === user.id);

  return sendOk(c, { matches: mine, totalConsidered: all.length });
});
