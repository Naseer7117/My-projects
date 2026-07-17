/*
 * companionConfig.ts — THE single source of truth for every companion size/
 * layout constant. Before this file existed, "1280" (content column width)
 * was hardcoded independently in companionZones.ts AND three places in
 * App.css, and "72"/"36" (companion size / half-size) was hardcoded
 * independently in companionZones.ts, HomePage.tsx, and App.css's
 * --companion-size custom property — four and three copies respectively,
 * each capable of silently drifting out of sync. Every one of those call
 * sites now imports from here instead.
 *
 * The one exception CSS can't avoid is --companion-size itself, since CSS
 * needs it as a custom property to size the mascot's container —
 * applyCompanionSizeCssVar() below sets that property FROM these constants
 * at app start, so App.css's `var(--companion-size, 96px)` fallback is only
 * ever a fallback, never the live value.
 */

export const CONTENT_MAX_WIDTH = 1280; // must match .container/.container-xxl max-width in App.css
export const NAVBAR_CLEARANCE = 84; // px — stay below the sticky navbar
export const EDGE_INSET = 16; // px — never touch the very edge

// 96px (user asked for a bigger mascot; was 80, before that 72 for the old
// SVG rig). Trade-off, documented: minViewportForGutterRoaming() becomes
// 1280 + (16*2 + 96) * 2 = 1536 exactly — so 1536-wide laptops KEEP gutter
// roaming (>= check), but 1512-wide MacBook-class viewports now fall back
// to the fixed corner pocket (still animated/alive, just not roaming).
// Going bigger than 96 would also cost 1536 screens their roaming.
export const COMPANION_SIZE_DESKTOP = 96; // px
export const COMPANION_SIZE_MOBILE = 64; // px
export const COMPANION_MOBILE_BREAKPOINT = 767; // px — matches App.css's max-width: 767px companion block

export function companionSizeFor(viewportWidth: number): number {
  return viewportWidth <= COMPANION_MOBILE_BREAKPOINT ? COMPANION_SIZE_MOBILE : COMPANION_SIZE_DESKTOP;
}

/** Viewports narrower than this have no guaranteed-empty side gutter (content
 * runs edge to edge), so roaming is disabled in favor of a fixed corner. */
export function minViewportForGutterRoaming(): number {
  return CONTENT_MAX_WIDTH + (EDGE_INSET * 2 + COMPANION_SIZE_DESKTOP) * 2;
}

// The single aspect ratio (width / height) every mascot clip is normalized to
// by scripts/normalize_clips.py. The locked pose box in App.css derives its
// width from --companion-size × this, so `object-fit: contain` seats every
// clip at an identical scale with feet on the baseline. Changing the
// normalizer's CANVAS_W/CANVAS_H means changing this in lockstep.
export const COMPANION_POSE_ASPECT = 260 / 360; // 0.722

/** Sets --companion-size and --companion-pose-aspect on :root from the
 * constants above, once, so CSS and JS can never disagree. Call at app mount. */
export function applyCompanionSizeCssVar(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--companion-pose-aspect', `${COMPANION_POSE_ASPECT}`);
  const apply = () => {
    root.style.setProperty('--companion-size', `${companionSizeFor(window.innerWidth)}px`);
  };
  apply();
  window.addEventListener('resize', apply);
}
