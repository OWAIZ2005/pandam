/**
 * Review eligibility rules (pure). A review is only valid when:
 *  1. the transaction is `completed`,
 *  2. the reviewer was a party to it (initiator or counterparty),
 *  3. the reviewer has not already reviewed this transaction,
 *  4. the reviewee is the *other* party (never yourself).
 *
 * The DB also enforces (3) via UNIQUE(transaction, reviewer), (4) via CHECK,
 * and rating range via CHECK — this function is the friendly first check.
 */
import { type BarterTransactionStatus } from '@pandam/types';

export interface ReviewableTransaction {
  status: BarterTransactionStatus;
  initiatedByUserId: string;
  counterpartyUserId: string;
}

export type ReviewRejection =
  'transaction_not_completed' | 'reviewer_not_a_party' | 'already_reviewed' | 'cannot_review_self';

export function canReview(params: {
  transaction: ReviewableTransaction;
  reviewerId: string;
  revieweeId: string;
  reviewerHasReviewed: boolean;
}): { ok: true } | { ok: false; reason: ReviewRejection } {
  const { transaction, reviewerId, revieweeId, reviewerHasReviewed } = params;
  const parties = [transaction.initiatedByUserId, transaction.counterpartyUserId];

  if (transaction.status !== 'completed') {
    return { ok: false, reason: 'transaction_not_completed' };
  }
  if (!parties.includes(reviewerId)) {
    return { ok: false, reason: 'reviewer_not_a_party' };
  }
  if (reviewerId === revieweeId) {
    return { ok: false, reason: 'cannot_review_self' };
  }
  if (!parties.includes(revieweeId)) {
    return { ok: false, reason: 'reviewer_not_a_party' };
  }
  if (reviewerHasReviewed) {
    return { ok: false, reason: 'already_reviewed' };
  }
  return { ok: true };
}

/** Given a transaction and one party, who is the reviewee. */
export function otherParty(transaction: ReviewableTransaction, reviewerId: string): string | null {
  if (reviewerId === transaction.initiatedByUserId) return transaction.counterpartyUserId;
  if (reviewerId === transaction.counterpartyUserId) return transaction.initiatedByUserId;
  return null;
}
