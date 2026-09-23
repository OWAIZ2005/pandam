/**
 * Demo-data seam — the ONE switch for showcase content.
 *
 * Off by default. Turn on with `EXPO_PUBLIC_DEMO_DATA=1` (e.g. in
 * `apps/app/.env.local`) to fill screens with believable Pandam listings for
 * design reviews and screenshots. With it off, `demoQuery()` returns the real
 * query untouched, so production data flow is identical to before.
 *
 * To remove demo data entirely: delete `src/dummy/` and unwrap the handful of
 * `demoQuery(...)` calls (grep for it).
 *
 * Frontend-only. Must never be imported by `apps/worker` or any package.
 */
export const IS_DEMO_DATA = process.env.EXPO_PUBLIC_DEMO_DATA === '1';

/**
 * Overlay demo data onto a React Query result when demo mode is on. The query
 * still runs (hooks are untouched); only what the screen renders changes.
 */
export function demoQuery<Q extends { data?: unknown }>(query: Q, demo: NonNullable<Q['data']>): Q {
  if (!IS_DEMO_DATA) return query;
  return {
    ...query,
    data: demo,
    isPending: false,
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
    status: 'success',
  } as Q;
}

/** Wrap a flat list as the `{ pages, pageParams }` shape of an infinite query. */
export function demoPages<T>(items: T[]) {
  return { pages: [{ items, nextCursor: null }], pageParams: [undefined] };
}

export * from './data';
