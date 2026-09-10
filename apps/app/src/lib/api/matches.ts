import { type ReciprocalMatchView } from '@pandam/types';

import { api } from './client';

export const matchesApi = {
  list: () => api.get<{ items: ReciprocalMatchView[] }>('/api/v1/matches'),
};
