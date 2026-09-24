/**
 * `/api/v1/verification` — first-time identity verification.
 *
 *   POST /government-id   record the government-ID step (demo mode only today)
 *   POST /face            record the face step (demo; requires government-id first)
 *
 * Both return the same `AuthenticatedUser` shape as `GET /auth/me`, so the
 * client updates its single session cache and never keeps a second copy of
 * verification state. Status itself is read from `/auth/me`.
 */
import { type AuthenticatedUser } from '@pandam/types';
import { verificationStepSchema } from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { sendOk } from '../../../lib/http';
import { toPublicProfile, toSafeUser } from '../../../lib/serialize';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { createVerificationService, type VerificationStep } from '../../../services/verification';
import { type AppEnv } from '../../../types';

export const verificationRoute = new Hono<AppEnv>();

verificationRoute.use('*', authMiddleware, requireAuth);

async function handle(c: Context<AppEnv>, step: VerificationStep) {
  await parseBody(c, verificationStepSchema);
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const service = createVerificationService(repos, {
    demoAllowed: c.env.PANDAM_ENV !== 'production',
  });
  const updated = await service.recordStep(user, step);
  const profile = await repos.profiles.findByUserId(updated.id);
  const body: AuthenticatedUser = { user: toSafeUser(updated), profile: toPublicProfile(profile) };
  return sendOk(c, body);
}

verificationRoute.post('/government-id', (c) => handle(c, 'governmentId'));
verificationRoute.post('/face', (c) => handle(c, 'face'));
