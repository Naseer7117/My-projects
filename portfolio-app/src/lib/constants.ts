/*
 * constants.ts — tuning values for the interactive effects.
 *
 * Previously these were "magic numbers" scattered through the interactions hook
 * (0.2, 130, 26000, 16000, …). Naming them here makes the behaviour tunable and
 * self-documenting without hunting through the animation loop.
 */

// --- Scroll reveal ---------------------------------------------------------
export const REVEAL_STAGGER_STEP_MS = 70; // delay added per sibling
export const REVEAL_STAGGER_MAX_STEPS = 8; // cap so long lists don't lag
export const REVEAL_THRESHOLD = 0.12; // % of element visible before revealing
export const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px';

// --- Count-up --------------------------------------------------------------
export const COUNT_DURATION_MS = 1600;

// --- Tilt / magnetic -------------------------------------------------------
export const DEFAULT_TILT_DEG = 6;
export const DEFAULT_MAGNETIC_STRENGTH = 0.4;

// --- Cursor ----------------------------------------------------------------
export const CURSOR_RING_LERP = 0.2; // how quickly the ring catches the dot
export const CURSOR_LINK_DIST = 180; // px within which particles link to cursor
export const CURSOR_LINK_ALPHA = 0.6;
export const CURSOR_PULL_DIST_SQ = 26000; // squared px radius of cursor attraction
export const CURSOR_PULL_FORCE = 0.6;
export const CURSOR_PULL_FACTOR = 0.02;

// Selector for elements that should activate the enlarged cursor ring.
export const CURSOR_INTERACTIVE_SELECTOR =
  'a, button, .btn, [data-tilt], .quick-link, input, textarea, [role="button"]';

// --- Navbar ----------------------------------------------------------------
export const NAVBAR_SCROLL_THRESHOLD = 12; // px scrolled before the navbar "sticks"

// --- Particle constellation ------------------------------------------------
export const PARTICLE_MAX = 120;
export const PARTICLE_AREA_DIVISOR = 16000; // one particle per N px² (capped by MAX)
export const PARTICLE_SPEED = 0.35;
export const PARTICLE_MAX_SPEED = 0.9;
export const PARTICLE_RADIUS_MIN = 0.6;
export const PARTICLE_RADIUS_JITTER = 1.6;
export const PARTICLE_LINK_DIST = 130; // px within which two particles link
export const PARTICLE_LINK_ALPHA = 0.5;
export const PARTICLE_FILL = 'rgba(150, 170, 255, 0.55)';
export const PARTICLE_LINK_RGB = '120, 150, 255';
export const CURSOR_LINK_RGB = '34, 211, 238';
