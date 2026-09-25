import { type Category } from '@pandam/types';
import { type CreateCategoryInput } from '@pandam/validation';

import { api } from './client';

export const categoriesApi = {
  list: () => api.get<{ categories: Category[] }>('/api/v1/categories'),
  create: (input: CreateCategoryInput) =>
    api.post<{ category: Category }>('/api/v1/categories', input),
};
