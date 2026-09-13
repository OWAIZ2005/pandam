import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CreateDisputeInput, type CreateReportInput } from '@pandam/validation';

import { reportsApi } from '@/lib/api/reports';
import { qk } from '@/lib/query/keys';

export function useMyReports() {
  return useQuery({
    queryKey: qk.reports.mine,
    queryFn: async () => (await reportsApi.mine()).items,
    staleTime: 30_000,
  });
}

export function useCreateReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) => reportsApi.create(input),
    onSuccess: () => void client.invalidateQueries({ queryKey: qk.reports.mine }),
  });
}

export function useDisputes(transactionId: string | undefined) {
  return useQuery({
    queryKey: qk.reports.disputes(transactionId ?? ''),
    queryFn: async () => (await reportsApi.disputesFor(transactionId!)).items,
    enabled: !!transactionId,
  });
}

export function useCreateDispute() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDisputeInput) => reportsApi.createDispute(input),
    onSuccess: (_res, input) => {
      void client.invalidateQueries({ queryKey: qk.reports.disputes(input.transactionId) });
      void client.invalidateQueries({ queryKey: qk.transactions.detail(input.transactionId) });
    },
  });
}
