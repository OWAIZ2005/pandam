/** TanStack Query hooks for reviews. */
import { type CreateReviewInput } from '@pandam/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reviewsApi } from '@/lib/api/reviews';
import { qk } from '@/lib/query/keys';

export function useReviewsForUser(userId: string | undefined) {
  return useQuery({
    queryKey: qk.reviews.forUser(userId ?? ''),
    queryFn: async () => (await reviewsApi.forUser(userId!)).items,
    enabled: !!userId,
  });
}

export function useCreateReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsApi.create(input),
    onSuccess: (res) => {
      void client.invalidateQueries({ queryKey: qk.transactions.all });
      void client.invalidateQueries({ queryKey: qk.transactions.detail(res.review.transactionId) });
      void client.invalidateQueries({ queryKey: qk.reviews.forUser(res.review.revieweeId) });
    },
  });
}
