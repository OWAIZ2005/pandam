/**
 * `/api/v1/categories` — the category list used as the normalised matching key.
 *
 *   GET  /   active categories (public)
 *   POST /   add a category (signed-in members)
 *
 * The slug is the dedupe key: "Web Design", "web  design" and "WEB DESIGN" are
 * one category. Adding an existing one returns 409 with the existing category
 * in `details.existingId`, so the client can simply select it instead.
 */
import { toSlug } from '@pandam/database';
import { createCategorySchema } from '@pandam/validation';
import { Hono } from 'hono';

import { ApiError, sendOk } from '../../../lib/http';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

export const categoriesRoute = new Hono<AppEnv>();

categoriesRoute.get('/', async (c) => {
  const categories = await c.get('ctx').repos.categories.listActive();
  return sendOk(c, { categories });
});

categoriesRoute.post('/', authMiddleware, requireAuth, async (c) => {
  const { name } = await parseBody(c, createCategorySchema);
  const { repos } = c.get('ctx');
  const slug = toSlug(name);
  if (!slug) {
    throw new ApiError('validation_error', 'Invalid category name.', {
      name: ['must contain letters or numbers'],
    });
  }
  const existing = await repos.categories.findBySlug(slug);
  if (existing) {
    throw new ApiError('conflict', `"${existing.name}" already exists.`, {
      name: ['already exists'],
      existingId: [existing.id],
    });
  }
  const category = await repos.categories.create({ name, slug });
  return sendOk(c, { category }, 201);
});
