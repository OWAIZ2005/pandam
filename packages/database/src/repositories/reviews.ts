import { desc, eq } from 'drizzle-orm';

import { newId } from '../id';
import { type NewReviewRow, type ReviewRow, reviews } from '../schema/reviews';

import { type Database, one } from './helpers';

export type CreateReviewInput = Omit<NewReviewRow, 'id' | 'createdAt'>;

export function reviewsRepository(db: Database) {
  return {
    /**
     * Insert a review. Eligibility (transaction completed, reviewer is a party,
     * not already reviewed) MUST be checked by the Worker domain layer first;
     * the UNIQUE (transaction, reviewer) index and CHECK constraints are the
     * last line of defence.
     */
    async create(input: CreateReviewInput): Promise<ReviewRow> {
      const rows = await db
        .insert(reviews)
        .values({ ...input, id: newId('review') })
        .returning();
      return one(rows, 'reviews.create');
    },

    async findByTransactionAndReviewer(
      transactionId: string,
      reviewerId: string,
    ): Promise<ReviewRow | null> {
      const rows = await db
        .select()
        .from(reviews)
        .where(eq(reviews.transactionId, transactionId))
        .limit(50);
      return rows.find((r) => r.reviewerId === reviewerId) ?? null;
    },

    async listForReviewee(revieweeId: string): Promise<ReviewRow[]> {
      return db
        .select()
        .from(reviews)
        .where(eq(reviews.revieweeId, revieweeId))
        .orderBy(desc(reviews.createdAt));
    },
  };
}

export type ReviewsRepository = ReturnType<typeof reviewsRepository>;
