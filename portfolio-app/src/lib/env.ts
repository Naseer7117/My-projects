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
 * Whether to run a heavy DESKTOP-only decorative effect right now: motion
 * allowed, a fine pointer, and a wide-enough viewport. This is the composite
 * gate that CinematicIntro / FooterRibbons (and any future heavy desktop effect)
 * share — centralised here so the policy lives in ONE place instead of being
 * hand-written per component. `minWidth` defaults to 900 (the effects' current
 * threshold); FooterRobot passes its own (COMPANION_MOBILE_BREAKPOINT) and keeps
 * its extra Save-Data check on top. Boolean-identical to the inline expressions.
 */
export function canRunHeavyDesktopFx(minWidth = 900): boolean {
  return (
    typeof window !== 'undefined' &&
    !prefersReducedMotion() &&
    hasFinePointer() &&
    window.innerWidth > minWidth
  );
}

/**
 * Whether to run the CINEMATIC scroll-intro (laptop-open sequence, constellation,
 * greeting, floating paths). Unlike canRunHeavyDesktopFx this INCLUDES capable
 * MOBILE devices — the owner wants the same landing experience on phones. Drops
 * the fine-pointer + wide-viewport requirement (the mouse-sheen no-ops on touch;
 * GSAP scrubs on touch scroll), but EXCLUDES low-power devices: measured on a
 * 4-core emulator the cinematic's per-frame cost (GSAP scrub + constellation rAF +
 * 60 hue-rotate keys) dropped it to ~7fps — janky. Weak devices get the smooth
 * lightweight mobile hero instead (60fps); capable phones (≥6 cores) get the full
 * cinematic. reduced-motion always opts out.
 */
export function canRunCinematic(): boolean {
  return typeof window !== 'undefined' && !prefersReducedMotion() && !isLowPowerDevice();
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
