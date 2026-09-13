/** TanStack Query hooks for real-money payments (Razorpay Payment Links). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { paymentsApi } from '@/lib/api/payments';
import { qk } from '@/lib/query/keys';

export function useMyPayments() {
  return useQuery({
    queryKey: qk.payments.all,
    queryFn: async () => (await paymentsApi.mine()).items,
    staleTime: 10_000,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: qk.payments.detail(id ?? ''),
    queryFn: async () => (await paymentsApi.get(id!)).payment,
    enabled: !!id,
    // Poll while the payment is still open — the webhook updates status
    // server-side, and this is how the app notices without its own socket.
    refetchInterval: (query) => (query.state.data?.status === 'created' ? 4_000 : false),
  });
}

export function useCreatePayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => paymentsApi.create({ listingId }),
    onSuccess: () => void client.invalidateQueries({ queryKey: qk.payments.all }),
  });
}

export function useCancelPayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.cancel(id),
    onSuccess: (res) => {
      client.setQueryData(qk.payments.detail(res.payment.id), res.payment);
      void client.invalidateQueries({ queryKey: qk.payments.all });
    },
  });
}
