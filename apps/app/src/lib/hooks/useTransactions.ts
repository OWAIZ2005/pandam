/** TanStack Query hooks for barter transactions. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { transactionsApi, type TransactionAction } from '@/lib/api/transactions';
import { qk } from '@/lib/query/keys';

export function useTransactions() {
  return useQuery({
    queryKey: qk.transactions.all,
    queryFn: async () => (await transactionsApi.list()).items,
    staleTime: 15_000,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: qk.transactions.detail(id ?? ''),
    queryFn: async () => (await transactionsApi.get(id!)).transaction,
    enabled: !!id,
  });
}

export function useSetTransactionStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: TransactionAction }) =>
      transactionsApi.setStatus(id, action),
    onSuccess: (res) => {
      client.setQueryData(qk.transactions.detail(res.transaction.id), res.transaction);
      void client.invalidateQueries({ queryKey: qk.transactions.all });
      void client.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
