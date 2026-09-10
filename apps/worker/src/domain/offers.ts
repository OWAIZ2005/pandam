/**
 * Offer lifecycle rules (pure).
 *
 *   pending ─▶ accepted   (recipient)
 *   pending ─▶ rejected   (recipient)
 *   pending ─▶ cancelled  (sender)
 *   pending ─▶ expired    (system, once past `expiresAt`)
 *
 * `pending` is the only non-terminal state. Who may perform each action is a
 * separate authorization concern handled at the route layer.
 */
import { type OfferStatus } from '@pandam/types';

export type OfferAction = 'accept' | 'reject' | 'cancel' | 'expire';

const TRANSITIONS: Record<OfferAction, { from: OfferStatus; to: OfferStatus }> = {
  accept: { from: 'pending', to: 'accepted' },
  reject: { from: 'pending', to: 'rejected' },
  cancel: { from: 'pending', to: 'cancelled' },
  expire: { from: 'pending', to: 'expired' },
};

export const TERMINAL_OFFER_STATUS: readonly OfferStatus[] = [
  'accepted',
  'rejected',
  'cancelled',
  'expired',
];

export function isTerminalOfferStatus(status: OfferStatus): boolean {
  return TERMINAL_OFFER_STATUS.includes(status);
}

export interface OfferTransitionError {
  code: 'invalid_transition';
  message: string;
}

/**
 * Resolve the next status for an action, or an error if the current status does
 * not allow it. Never throws — callers decide how to surface the error.
 */
export function offerTransition(
  current: OfferStatus,
  action: OfferAction,
): { ok: true; next: OfferStatus } | { ok: false; error: OfferTransitionError } {
  const rule = TRANSITIONS[action];
  if (current !== rule.from) {
    return {
      ok: false,
      error: {
        code: 'invalid_transition',
        message: `cannot ${action} an offer that is "${current}" (must be "${rule.from}")`,
      },
    };
  }
  return { ok: true, next: rule.to };
}

/** True if `expiresAt` (epoch ms) is set and in the past relative to `nowMs`. */
export function isOfferExpired(
  offer: { status: OfferStatus; expiresAt: number | null },
  nowMs: number,
): boolean {
  return offer.status === 'pending' && offer.expiresAt !== null && offer.expiresAt <= nowMs;
}
