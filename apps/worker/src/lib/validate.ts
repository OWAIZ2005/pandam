/**
 * Parse + validate a JSON request body against a Zod schema, turning failures
 * into the standard error envelope (`400 bad_request` for non-JSON,
 * `422 validation_error` with field `details` for schema failures).
 */
import { type ZodTypeAny, type z } from '@pandam/validation';
import { type Context } from 'hono';

import { type AppEnv } from '../types';

import { ApiError, zodDetails } from './http';

export async function parseBody<TSchema extends ZodTypeAny>(
  c: Context<AppEnv>,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new ApiError('bad_request', 'Request body must be valid JSON.');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(
      'validation_error',
      'The request did not pass validation.',
      zodDetails(result.error),
    );
  }
  return result.data;
}
