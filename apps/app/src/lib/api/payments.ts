import { type PaymentView } from '@pandam/types';
import { type CreatePaymentInput } from '@pandam/validation';

import { api } from './client';

export const paymentsApi = {
  create: (input: CreatePaymentInput) =>
    api.post<{ payment: PaymentView }>('/api/v1/payments', input),
  mine: () => api.get<{ items: PaymentView[] }>('/api/v1/payments/mine'),
  get: (id: string) => api.get<{ payment: PaymentView }>(`/api/v1/payments/${id}`),
  cancel: (id: string) => api.post<{ payment: PaymentView }>(`/api/v1/payments/${id}/cancel`),
};
