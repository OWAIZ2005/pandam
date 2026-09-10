import { describe, expect, it } from 'vitest';

import { isOfferExpired, isTerminalOfferStatus, offerTransition } from '../../src/domain/offers';

describe('offerTransition', () => {
  it('allows accept/reject/cancel/expire only from pending', () => {
    expect(offerTransition('pending', 'accept')).toEqual({ ok: true, next: 'accepted' });
    expect(offerTransition('pending', 'reject')).toEqual({ ok: true, next: 'rejected' });
    expect(offerTransition('pending', 'cancel')).toEqual({ ok: true, next: 'cancelled' });
    expect(offerTransition('pending', 'expire')).toEqual({ ok: true, next: 'expired' });
  });

  it('rejects any transition out of a terminal state', () => {
    for (const status of ['accepted', 'rejected', 'cancelled', 'expired'] as const) {
      const result = offerTransition(status, 'accept');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('invalid_transition');
    }
  });

  it('cannot re-accept an already accepted offer', () => {
    const result = offerTransition('accepted', 'accept');
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'invalid_transition',
        message: 'cannot accept an offer that is "accepted" (must be "pending")',
      },
    });
  });
});

describe('isTerminalOfferStatus', () => {
  it('classifies states correctly', () => {
    expect(isTerminalOfferStatus('pending')).toBe(false);
    expect(isTerminalOfferStatus('accepted')).toBe(true);
    expect(isTerminalOfferStatus('expired')).toBe(true);
  });
});

describe('isOfferExpired', () => {
  const now = 1_000_000;
  it('is true only for a pending offer past its expiry', () => {
    expect(isOfferExpired({ status: 'pending', expiresAt: now - 1 }, now)).toBe(true);
    expect(isOfferExpired({ status: 'pending', expiresAt: now + 1 }, now)).toBe(false);
    expect(isOfferExpired({ status: 'pending', expiresAt: null }, now)).toBe(false);
    expect(isOfferExpired({ status: 'accepted', expiresAt: now - 1 }, now)).toBe(false);
  });
});
