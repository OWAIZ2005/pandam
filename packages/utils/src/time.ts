/** Time helpers with an injectable clock so they stay testable. */

export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

/** Current time as an ISO-8601 string. */
export function nowIso(clock: Clock = systemClock): string {
  return clock().toISOString();
}

/** Milliseconds elapsed since `start` (a Date or epoch ms). */
export function elapsedMs(start: Date | number, clock: Clock = systemClock): number {
  const startMs = typeof start === 'number' ? start : start.getTime();
  return clock().getTime() - startMs;
}
