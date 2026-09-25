import { type Category } from '@pandam/types';
import { type CreateCategoryInput } from '@pandam/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { IS_DEMO_DATA, demoCategoryList } from '@/dummy';
import { categoriesApi } from '@/lib/api/categories';
import { qk } from '@/lib/query/keys';

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: async (): Promise<Category[]> => (await categoriesApi.list()).categories,
    staleTime: 10 * 60_000,
  });
}

/** Sort order the Worker gives member-created categories (see categories repo). */
const MEMBER_SORT = 500;

/**
 * Categories for browsing surfaces (Home grid, Discover chips). Normally the
 * live list; in demo mode the demo taxonomy plus any categories members have
 * really created, so a newly added category shows up either way.
 */
export function useBrowseCategories() {
  const live = useCategories();
  if (!IS_DEMO_DATA) return live;
  const demoSlugs = new Set(demoCategoryList.map((c) => c.slug));
  const added = (live.data ?? []).filter(
    (c) => c.sortOrder === MEMBER_SORT && !demoSlugs.has(c.slug),
  );
  return {
    ...live,
    data: [...(demoCategoryList as unknown as Category[]), ...added],
    isPending: false,
    isError: false,
  } as typeof live;
}

/** Add a category; the new row is written into the cache so it appears at once. */
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: ({ category }) => {
      qc.setQueryData<Category[]>(qk.categories, (prev) =>
        prev ? [...prev.filter((c) => c.id !== category.id), category] : [category],
      );
      void qc.invalidateQueries({ queryKey: qk.categories });
    },
  });
}
