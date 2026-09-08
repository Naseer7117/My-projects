/*
 * env.ts — shared checks about the visitor's environment.
 *
 * These were previously re-implemented as inline `window.matchMedia(...)` calls
 * in five different files (the interactions hook, App, NavBrand, ContactPage).
 * Centralising them means the "should we animate?" rules live in ONE place, and
 * the extra `!window.matchMedia` guard makes them safe in non-browser/test
 * environments (jsdom) instead of throwing.
 */

/** True when the visitor asked their OS to minimise animation. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True for a precise pointer (mouse / trackpad); false on touch screens. */
export function hasFinePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(pointer: fine)').matches;
}

/**
 * True on weak / low-power hardware (few CPU cores or little RAM). Used to dial
 * DOWN the heavy intro effects — sparser constellation grid, DPR capped to 1 —
 * so the site stays smooth on machines without a real GPU. Conservative: only
 * flags clearly low-end devices; unknown hardware is treated as capable.
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof cores === 'number' && cores > 0 && cores <= 4) return true;
  if (typeof mem === 'number' && mem > 0 && mem <= 4) return true;
  return false;
}
