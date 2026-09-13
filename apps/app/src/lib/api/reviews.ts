import { type ReviewView } from '@pandam/types';
import { type CreateReviewInput } from '@pandam/validation';

import { api } from './client';

export const reviewsApi = {
  forUser: (userId: string) => api.get<{ items: ReviewView[] }>(`/api/v1/reviews/users/${userId}`),
  create: (input: CreateReviewInput) => api.post<{ review: ReviewView }>('/api/v1/reviews', input),
};
