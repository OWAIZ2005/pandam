import { useQuery } from '@tanstack/react-query';

import { matchesApi } from '@/lib/api/matches';
import { qk } from '@/lib/query/keys';

export function useMatches() {
  return useQuery({
    queryKey: qk.matches,
    queryFn: async () => (await matchesApi.list()).items,
    staleTime: 20_000,
  });
}
