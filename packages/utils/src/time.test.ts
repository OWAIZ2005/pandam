import { describe, expect, it } from 'vitest';

import { elapsedMs, nowIso } from './time';

const fixedClock = () => new Date('2026-01-01T00:00:10.000Z');

describe('nowIso', () => {
  it('formats the injected clock as ISO-8601', () => {
    expect(nowIso(fixedClock)).toBe('2026-01-01T00:00:10.000Z');
  });
});

describe('elapsedMs', () => {
  it('measures from a Date', () => {
    expect(elapsedMs(new Date('2026-01-01T00:00:00.000Z'), fixedClock)).toBe(10_000);
  });

  it('measures from epoch ms', () => {
    expect(elapsedMs(Date.parse('2026-01-01T00:00:00.000Z'), fixedClock)).toBe(10_000);
  });
});
