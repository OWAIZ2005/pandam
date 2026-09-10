import { type Category } from '@pandam/types';

import { api } from './client';

export const categoriesApi = {
  list: () => api.get<{ categories: Category[] }>('/api/v1/categories'),
};
