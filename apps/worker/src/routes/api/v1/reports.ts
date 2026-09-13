/**
 * `/api/v1/reports` — abuse reports and transaction disputes.
 *
 *   POST /            report a user, listing, need, message or transaction
 *   GET  /mine        reports the caller has filed (and their status)
 *   POST /disputes    raise a dispute about one barter transaction
 *   GET  /disputes/:transactionId   disputes the caller can see on a transaction
 *
 * There is no moderation UI in this phase: a report is a durable, reviewable
 * record with an `open` status, not something that automatically hides
 * content. Auto-hiding on report is how a marketplace gets weaponised, so
 * that decision stays human.
 */
import { createDisputeSchema, createReportSchema } from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { ApiError, sendOk } from '../../../lib/http';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { type AppEnv } from '../../../types';

export const reportsRoute = new Hono<AppEnv>();

reportsRoute.use('*', authMiddleware, requireAuth);

/**
 * Confirm the reported thing actually exists. `reports.subjectId` is
 * polymorphic and therefore has no foreign key, so without this check the
 * table would happily accumulate reports against ids that never existed.
 */
async function assertSubjectExists(
  c: Context<AppEnv>,
  subjectType: 'user' | 'listing' | 'need' | 'message' | 'transaction',
  subjectId: string,
): Promise<void> {
  const { repos } = c.get('ctx');
  const found = await (async () => {
    switch (subjectType) {
      case 'user':
        return repos.users.findById(subjectId);
      case 'listing':
        return repos.listings.findById(subjectId);
      case 'need':
        return repos.needs.findById(subjectId);
      case 'message':
        return repos.messages.findById(subjectId);
      case 'transaction':
        return repos.barterTransactions.findById(subjectId);
    }
  })();
  if (!found) throw new ApiError('not_found', 'The thing you are reporting does not exist.');
}

reportsRoute.post('/', async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, createReportSchema);

  if (input.subjectType === 'user' && input.subjectId === user.id) {
    throw new ApiError('unprocessable', 'You cannot report yourself.');
  }
  await assertSubjectExists(c, input.subjectType, input.subjectId);

  const report = await repos.reports.create({
    reporterId: user.id,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    reason: input.reason,
    details: input.details ?? null,
  });

  return sendOk(
    c,
    {
      report: {
        id: report.id,
        subjectType: report.subjectType,
        subjectId: report.subjectId,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt,
      },
    },
    201,
  );
});

reportsRoute.get('/mine', async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const rows = await repos.reports.listByReporter(user.id);
  return sendOk(c, {
    items: rows.map((r) => ({
      id: r.id,
      subjectType: r.subjectType,
      subjectId: r.subjectId,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
});

reportsRoute.post('/disputes', async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, createDisputeSchema);

  const transaction = await repos.barterTransactions.findById(input.transactionId);
  // Non-participants get 404 rather than 403: whether a transaction exists is
  // itself none of their business.
  const isParticipant =
    !!transaction &&
    (transaction.initiatedByUserId === user.id || transaction.counterpartyUserId === user.id);
  if (!isParticipant) {
    throw new ApiError('not_found', 'That transaction does not exist.');
  }

  const dispute = await repos.disputes.create({
    transactionId: input.transactionId,
    raisedByUserId: user.id,
    reason: input.reason,
    details: input.details ?? null,
  });

  return sendOk(
    c,
    {
      dispute: {
        id: dispute.id,
        transactionId: dispute.transactionId,
        reason: dispute.reason,
        details: dispute.details,
        status: dispute.status,
        createdAt: dispute.createdAt,
      },
    },
    201,
  );
});

reportsRoute.get('/disputes/:transactionId', async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const transactionId = c.req.param('transactionId');
  const transaction = await repos.barterTransactions.findById(transactionId);
  const isParticipant =
    !!transaction &&
    (transaction.initiatedByUserId === user.id || transaction.counterpartyUserId === user.id);
  if (!isParticipant) throw new ApiError('not_found', 'That transaction does not exist.');

  const rows = await repos.disputes.listByTransaction(transactionId);
  return sendOk(c, {
    items: rows.map((d) => ({
      id: d.id,
      transactionId: d.transactionId,
      reason: d.reason,
      details: d.details,
      status: d.status,
      mine: d.raisedByUserId === user.id,
      createdAt: d.createdAt,
    })),
  });
});
