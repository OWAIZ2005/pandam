import { describe, expect, it } from 'vitest';

import { barterTransition, isTerminalBarterStatus } from '../../src/domain/barter';

describe('barterTransition', () => {
  it('walks the happy path created -> in_progress -> completed', () => {
    const started = barterTransition('created', 'start');
    expect(started).toEqual({ ok: true, next: 'in_progress' });
    const done = barterTransition('in_progress', 'complete');
    expect(done).toEqual({ ok: true, next: 'completed' });
  });

  it('allows cancel from created or in_progress', () => {
    expect(barterTransition('created', 'cancel')).toEqual({ ok: true, next: 'cancelled' });
    expect(barterTransition('in_progress', 'cancel')).toEqual({ ok: true, next: 'cancelled' });
  });

  it('cannot complete a transaction that has not started', () => {
    const result = barterTransition('created', 'complete');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_transition');
  });

  it('cannot transition out of completed or cancelled', () => {
    expect(barterTransition('completed', 'cancel').ok).toBe(false);
    expect(barterTransition('cancelled', 'start').ok).toBe(false);
  });

  it('supports dispute then resolution back to in_progress or cancelled', () => {
    expect(barterTransition('in_progress', 'dispute')).toEqual({ ok: true, next: 'disputed' });
    expect(barterTransition('disputed', 'resolve_in_progress')).toEqual({
      ok: true,
      next: 'in_progress',
    });
    expect(barterTransition('disputed', 'resolve_cancelled')).toEqual({
      ok: true,
      next: 'cancelled',
    });
  });
});

describe('isTerminalBarterStatus', () => {
  it('only completed and cancelled are terminal', () => {
    expect(isTerminalBarterStatus('completed')).toBe(true);
    expect(isTerminalBarterStatus('cancelled')).toBe(true);
    expect(isTerminalBarterStatus('disputed')).toBe(false);
    expect(isTerminalBarterStatus('created')).toBe(false);
  });
});
