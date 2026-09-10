import { type Category } from '@pandam/types';
import { useQuery } from '@tanstack/react-query';

import { categoriesApi } from '@/lib/api/categories';
import { qk } from '@/lib/query/keys';

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: async (): Promise<Category[]> => (await categoriesApi.list()).categories,
    staleTime: 10 * 60_000,
  });
}
