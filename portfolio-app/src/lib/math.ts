/*
 * math.ts — tiny numeric helpers shared by the animation code.
 */

/** Linear interpolation: eases `a` toward `b` by fraction `n` (0..1). */
export const lerp = (a: number, b: number, n: number): number => a + (b - a) * n;

/** Ease-out quart easing curve for count-ups and progress. */
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

/** Constrain `v` to the inclusive range [min, max]. */
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));
