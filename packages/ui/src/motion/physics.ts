/**
 * Shared gesture physics, transcribed from Apple's *Designing Fluid
 * Interfaces* (WWDC 2018) — see the `apple-design` skill for the full
 * derivation. Two primitives every draggable-and-releasable surface needs:
 *
 *  - `project()` turns a release velocity into a resting position, the same
 *    way scroll deceleration does, so a flick "throws" the surface toward
 *    where the gesture was headed rather than snapping from the raw release
 *    point.
 *  - `rubberband()` turns a hard boundary into soft, progressive resistance,
 *    so dragging past a limit still tracks the finger — just less and less.
 */

/**
 * Project where a gesture would come to rest under natural deceleration.
 *
 * @param velocity px/s at release.
 * @param decelerationRate ~0.998 for a normal scroll feel, ~0.99 for snappier.
 * @returns the additional distance (px) travelled after release.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Soft resistance past a boundary — real things slow down before they stop,
 * they don't hit a wall. `overshoot` is how far past the boundary the raw
 * drag has gone; the result is how far the surface should actually move.
 *
 * @param overshoot px past the boundary (always >= 0).
 * @param dimension the relevant size of the surface (its width or height).
 * @param constant higher = stiffer resistance. Apple's own value: 0.55.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (overshoot <= 0 || dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * overshoot);
}

/** Pick whichever of two snap points a projected position is closer to. */
export function nearestOf2(value: number, a: number, b: number): number {
  return Math.abs(value - a) <= Math.abs(value - b) ? a : b;
}
