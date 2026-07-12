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
