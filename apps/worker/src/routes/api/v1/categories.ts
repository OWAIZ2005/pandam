/**
 * `/api/v1/categories` — the curated, stable category list used as the
 * normalised matching key. Read-only and public.
 */
import { Hono } from 'hono';

import { sendOk } from '../../../lib/http';
import { type AppEnv } from '../../../types';

export const categoriesRoute = new Hono<AppEnv>();

categoriesRoute.get('/', async (c) => {
  const categories = await c.get('ctx').repos.categories.listActive();
  return sendOk(c, { categories });
});
