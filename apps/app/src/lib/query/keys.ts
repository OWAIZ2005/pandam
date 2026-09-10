/** Central query-key factory so invalidation stays consistent. */
import { type MarketKind } from '@/lib/api/market';

export const qk = {
  auth: { me: ['auth', 'me'] as const },
  categories: ['categories'] as const,
  matches: ['matches'] as const,
  market: {
    all: (kind: MarketKind) => ['market', kind] as const,
    discover: (kind: MarketKind, params: Record<string, unknown>) =>
      ['market', kind, 'discover', params] as const,
    mine: (kind: MarketKind) => ['market', kind, 'mine'] as const,
    detail: (kind: MarketKind, id: string) => ['market', kind, 'detail', id] as const,
  },
};
