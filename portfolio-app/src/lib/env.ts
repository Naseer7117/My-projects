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
 * Whether to run the FULL-MOTION cinematic scroll-intro (laptop-open sequence,
 * scroll-lunge, constellation, floating paths). Includes capable MOBILE devices
 * (owner wants the same landing on phones) and EXCLUDES low-power devices (on a
 * 4-core emulator the per-frame cost dropped to ~7fps — janky; those get the calm
 * static laptop or the lightweight mobile hero instead).
 *
 * reduced-motion: honoured on TOUCH devices only. On a real PC/laptop (a fine
 * pointer — mouse/trackpad) we run the full motion even with reduced-motion set,
 * because that OS flag is very often left on by accident there and most visitors
 * don't know why the site then looks stripped-down — the owner wants desktop
 * visitors to see the site exactly as built. Touch users who set reduced-motion
 * (more deliberate, and scroll-scrub motion-sickness matters more) still get the
 * calm static version.
 */
export function canRunCinematic(): boolean {
  if (typeof window === 'undefined' || isLowPowerDevice()) return false;
  if (prefersReducedMotion() && !hasFinePointer()) return false; // honour it on touch only
  return true;
}

/**
 * Whether the CINEMATIC-layer motion (star-wipe name reveal, constellation mesh,
 * greeting handwriting draw) should animate. Mirrors canRunCinematic's policy for
 * the pieces that check reduced-motion in JS rather than CSS: honour reduced-motion
 * on TOUCH devices only; a real PC/laptop (fine pointer) always animates so the
 * cinematic looks exactly as built. Use this in cinematic components INSTEAD of a
 * bare prefersReducedMotion() check. (Deliberately NOT used by accessibility-wide
 * effects like scroll-reveal / page transitions, which honour the flag everywhere.)
 */
export function cinematicMotionAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (prefersReducedMotion() && !hasFinePointer()) return false; // touch honours it
  return true;
}

/**
 * Whether to RENDER the cinematic opener at all — greeting, laptop and name —
 * regardless of whether it will fully animate. Unlike canRunCinematic() this
 * does NOT exclude reduced-motion visitors: they still SEE the laptop/greeting,
 * just in a calm static state (no scroll-lunge, no scrubbed pin, no drifting
 * paths). Only low-power devices are excluded (they get the lightweight mobile
 * hero instead). CinematicIntro uses this to decide whether to mount, and
 * canRunCinematic() to decide whether to run the full motion.
 */
export function canShowCinematic(): boolean {
  return typeof window !== 'undefined' && !isLowPowerDevice();
}

/**
 * True on weak / low-power hardware (few CPU cores or little RAM). Used to dial
 * DOWN the heavy intro effects — sparser constellation grid, DPR capped to 1 —
 * so the site stays smooth on machines without a real GPU. Conservative: only
 * flags clearly low-end devices; unknown hardware is treated as capable.
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const hasMM = typeof window !== 'undefined' && typeof window.matchMedia === 'function';

  // ANY device driven by a mouse/trackpad is a real computer — never gate it out.
  // This was a REAL, REPRODUCED BUG: the old rule excluded anything reporting
  // <=4 CPU cores OR <=4GB RAM, which is most university lab PCs, office desktops
  // and budget laptops. Those visitors saw the site with NO greeting, NO laptop,
  // NO constellation and NO scroll animations — "just a basic site" — across
  // Chrome, Edge and Brave with default settings. Browsers also under-report or
  // deliberately SPOOF these values (Brave caps deviceMemory), so they are simply
  // not a trustworthy proxy for "can this machine animate".
  // Desktop GPUs handle this content fine even at 2 cores; the real risk is phones.
  if (hasMM && window.matchMedia('(pointer: fine)').matches) {
    return false;
  }

  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const weakCores = typeof cores === 'number' && cores > 0 && cores <= 4;
  const weakMem = typeof mem === 'number' && mem > 0 && mem <= 4;

  // Touch devices only: require BOTH signals to be weak before dropping the
  // cinematic. Requiring either one alone excluded plenty of capable mid-range
  // phones (an 8-core handset that merely reports 4GB was being downgraded).
  return weakCores && weakMem;
}

