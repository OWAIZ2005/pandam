/**
 * `/api/v1/categories` — the curated, stable category list used as the
 * normalised matching key. Read-only and public; this is real, DB-backed
 * functionality that proves the D1 + Drizzle + repository wiring end to end.
 */
import { Hono } from 'hono';

import { buildContext } from '../../../context';
import { type AppBindings } from '../../../env';
import { sendOk } from '../../../lib/http';

export const categoriesRoute = new Hono<AppBindings>();

categoriesRoute.get('/', async (c) => {
  const { repos } = buildContext(c);
  const categories = await repos.categories.listActive();
  return sendOk(c, { categories });
});
