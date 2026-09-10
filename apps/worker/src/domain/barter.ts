/**
 * Barter transaction lifecycle rules (pure). This is NOT money — there is no
 * amount or currency anywhere. A transaction realises one accepted offer.
 *
 *   created ──start──▶ in_progress ──complete──▶ completed   (terminal)
 *      │                    │
 *      └──cancel──▶ cancelled (terminal) ◀──cancel──┘
 *                           │
 *                        dispute ▼
 *                        disputed ──resolve──▶ in_progress | cancelled
 */
import { type BarterTransactionStatus } from '@pandam/types';

export type BarterAction =
  'start' | 'complete' | 'cancel' | 'dispute' | 'resolve_in_progress' | 'resolve_cancelled';

const TRANSITIONS: Record<
  BarterAction,
  { from: BarterTransactionStatus[]; to: BarterTransactionStatus }
> = {
  start: { from: ['created'], to: 'in_progress' },
  complete: { from: ['in_progress'], to: 'completed' },
  cancel: { from: ['created', 'in_progress'], to: 'cancelled' },
  dispute: { from: ['in_progress'], to: 'disputed' },
  resolve_in_progress: { from: ['disputed'], to: 'in_progress' },
  resolve_cancelled: { from: ['disputed'], to: 'cancelled' },
};

export const TERMINAL_BARTER_STATUS: readonly BarterTransactionStatus[] = [
  'completed',
  'cancelled',
];

export function isTerminalBarterStatus(status: BarterTransactionStatus): boolean {
  return TERMINAL_BARTER_STATUS.includes(status);
}

export interface BarterTransitionError {
  code: 'invalid_transition';
  message: string;
}

export function barterTransition(
  current: BarterTransactionStatus,
  action: BarterAction,
): { ok: true; next: BarterTransactionStatus } | { ok: false; error: BarterTransitionError } {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(current)) {
    return {
      ok: false,
      error: {
        code: 'invalid_transition',
        message: `cannot "${action}" a transaction that is "${current}" (must be ${rule.from
          .map((s) => `"${s}"`)
          .join(' or ')})`,
      },
    };
  }
  return { ok: true, next: rule.to };
}
