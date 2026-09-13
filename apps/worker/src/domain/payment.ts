/**
 * Payment lifecycle rules (pure). A payment realises a real-money purchase of
 * one `sale`/`both` listing via a Razorpay Payment Link.
 *
 * The `paid` transition is special: it may ONLY be driven by a
 * signature-verified Razorpay webhook (see `lib/razorpay.ts` +
 * `routes/api/v1/payments.ts`). Nothing here or in the route layer ever trusts
 * a client-supplied "I paid" claim.
 *
 *   created ─▶ paid        (webhook: payment_link.paid)
 *      │  ├──▶ expired     (webhook: payment_link.expired, or past expiresAt)
 *      │  └──▶ cancelled   (buyer/seller, only while `created`)
 *   paid  ─▶ refunded      (seller-initiated)
 */
import { type PaymentStatus } from '@pandam/types';

export type PaymentAction = 'mark_paid' | 'mark_expired' | 'cancel' | 'refund';

const TRANSITIONS: Record<PaymentAction, { from: PaymentStatus[]; to: PaymentStatus }> = {
  mark_paid: { from: ['created'], to: 'paid' },
  mark_expired: { from: ['created'], to: 'expired' },
  cancel: { from: ['created'], to: 'cancelled' },
  refund: { from: ['paid'], to: 'refunded' },
};

export const TERMINAL_PAYMENT_STATUS: readonly PaymentStatus[] = [
  'paid',
  'expired',
  'cancelled',
  'refunded',
];

/** `paid` is terminal for the *purchase* even though a refund can follow. */
export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUS.includes(status) && status !== 'paid';
}

export interface PaymentTransitionError {
  code: 'invalid_transition';
  message: string;
}

export function paymentTransition(
  current: PaymentStatus,
  action: PaymentAction,
): { ok: true; next: PaymentStatus } | { ok: false; error: PaymentTransitionError } {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(current)) {
    return {
      ok: false,
      error: {
        code: 'invalid_transition',
        message: `cannot "${action}" a payment that is "${current}" (must be ${rule.from
          .map((s) => `"${s}"`)
          .join(' or ')})`,
      },
    };
  }
  return { ok: true, next: rule.to };
}

/** True if `expiresAt` (epoch ms) is set and in the past relative to `nowMs`. */
export function isPaymentExpired(
  payment: { status: PaymentStatus; expiresAt: number | null },
  nowMs: number,
): boolean {
  return payment.status === 'created' && payment.expiresAt !== null && payment.expiresAt <= nowMs;
}
