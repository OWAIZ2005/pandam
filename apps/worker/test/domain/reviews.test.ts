import { describe, expect, it } from 'vitest';

import { canReview, otherParty, type ReviewableTransaction } from '../../src/domain/reviews';

const completed: ReviewableTransaction = {
  status: 'completed',
  initiatedByUserId: 'usr_a',
  counterpartyUserId: 'usr_b',
};

describe('canReview', () => {
  it('allows a party to review the counterparty after completion', () => {
    expect(
      canReview({
        transaction: completed,
        reviewerId: 'usr_a',
        revieweeId: 'usr_b',
        reviewerHasReviewed: false,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects when the transaction is not completed', () => {
    expect(
      canReview({
        transaction: { ...completed, status: 'in_progress' },
        reviewerId: 'usr_a',
        revieweeId: 'usr_b',
        reviewerHasReviewed: false,
      }),
    ).toEqual({ ok: false, reason: 'transaction_not_completed' });
  });

  it('rejects a reviewer who was not a party', () => {
    expect(
      canReview({
        transaction: completed,
        reviewerId: 'usr_x',
        revieweeId: 'usr_b',
        reviewerHasReviewed: false,
      }),
    ).toEqual({ ok: false, reason: 'reviewer_not_a_party' });
  });

  it('rejects reviewing yourself', () => {
    expect(
      canReview({
        transaction: completed,
        reviewerId: 'usr_a',
        revieweeId: 'usr_a',
        reviewerHasReviewed: false,
      }),
    ).toEqual({ ok: false, reason: 'cannot_review_self' });
  });

  it('rejects a second review from the same reviewer', () => {
    expect(
      canReview({
        transaction: completed,
        reviewerId: 'usr_a',
        revieweeId: 'usr_b',
        reviewerHasReviewed: true,
      }),
    ).toEqual({ ok: false, reason: 'already_reviewed' });
  });
});

describe('otherParty', () => {
  it('returns the counterparty for each side, null for a stranger', () => {
    expect(otherParty(completed, 'usr_a')).toBe('usr_b');
    expect(otherParty(completed, 'usr_b')).toBe('usr_a');
    expect(otherParty(completed, 'usr_x')).toBeNull();
  });
});
