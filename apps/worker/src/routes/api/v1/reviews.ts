/**
 * `/api/v1/reviews` — reviews left after a COMPLETED barter transaction.
 *
 *   GET  /users/:userId    public reviews received by a user
 *   POST /                 leave a review for a transaction the caller was in
 *
 * Eligibility (`domain/reviews.ts::canReview`) requires the transaction be
 * `completed`, the caller be a party to it, and no existing review from the
 * caller — the DB's UNIQUE/CHECK constraints are the last line of defence.
 */
import { type OwnerRef, type ReviewView } from '@pandam/types';
import { createReviewSchema } from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { canReview, otherParty } from '../../../domain/reviews';
import { ApiError, sendOk } from '../../../lib/http';
import { toOwnerRef } from '../../../lib/serialize';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { notify } from '../../../services/notify';
import { type AppEnv } from '../../../types';

export const reviewsRoute = new Hono<AppEnv>();

reviewsRoute.get('/users/:userId', async (c) => {
  const { repos } = c.get('ctx');
  const rows = await repos.reviews.listForReviewee(c.req.param('userId'));
  const items = await Promise.all(rows.map((r) => hydrate(c, r)));
  return sendOk(c, { items });
});

reviewsRoute.post('/', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, createReviewSchema);

  const transaction = await repos.barterTransactions.findById(input.transactionId);
  if (!transaction) throw new ApiError('not_found', 'That transaction does not exist.');

  const revieweeId = otherParty(transaction, user.id);
  if (!revieweeId) {
    throw new ApiError('forbidden', 'You were not a party to that transaction.');
  }
  const existing = await repos.reviews.findByTransactionAndReviewer(input.transactionId, user.id);

  const check = canReview({
    transaction,
    reviewerId: user.id,
    revieweeId,
    reviewerHasReviewed: existing !== null,
  });
  if (!check.ok) {
    const messages: Record<typeof check.reason, string> = {
      transaction_not_completed: 'You can only review a completed transaction.',
      reviewer_not_a_party: 'You were not a party to that transaction.',
      already_reviewed: 'You already reviewed this transaction.',
      cannot_review_self: 'You cannot review yourself.',
    };
    throw new ApiError('unprocessable', messages[check.reason]);
  }

  const review = await repos.reviews.create({
    transactionId: input.transactionId,
    reviewerId: user.id,
    revieweeId,
    rating: input.rating,
    comment: input.comment ?? null,
  });

  await notify(c, {
    userId: revieweeId,
    type: 'review_received',
    data: { reviewId: review.id, transactionId: input.transactionId },
  });

  return sendOk(c, { review: await hydrate(c, review) }, 201);
});

async function hydrate(
  c: Context<AppEnv>,
  review: {
    id: string;
    transactionId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment: string | null;
    createdAt: number;
  },
): Promise<ReviewView> {
  const { repos } = c.get('ctx');
  const profile = await repos.profiles.findByUserId(review.reviewerId);
  const reviewer: OwnerRef = toOwnerRef(review.reviewerId, profile);
  return {
    id: review.id,
    transactionId: review.transactionId,
    reviewer,
    revieweeId: review.revieweeId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}
