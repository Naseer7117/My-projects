/*
 * companionZones.ts — where the roaming companion is allowed to stand.
 *
 * The companion is `position: fixed` (viewport-relative, ignores scroll) and
 * `pointer-events: none`, so it can never block a click — but it should still
 * avoid visually sitting on top of body text/headings, or it just looks
 * broken. We don't measure real content per page (expensive, and fragile
 * across very different page layouts) — instead we rely on a structural
 * fact: content is centered in a `max-width: 1280px` column (see
 * `.container, .container-xxl` in App.css), so anything outside that column
 * is guaranteed to be empty background, at ANY page, ANY scroll position.
 *
 * That column-relative gutter is the ONLY zone we roam in on viewports wide
 * enough to have one. Below that width the content is edge-to-edge and
 * there is no such guaranteed-empty band anywhere on the page — so on
 * narrow/mobile viewports the companion holds a single corner pocket
 * instead of roaming. All size/breakpoint constants live in
 * companionConfig.ts (the single source of truth) — nothing is redefined
 * here.
 */

import {
  CONTENT_MAX_WIDTH,
  NAVBAR_CLEARANCE,
  EDGE_INSET,
  companionSizeFor,
  minViewportForGutterRoaming,
} from './companionConfig';

export type Point = { x: number; y: number };

/** True when this viewport is wide enough to have a real, content-free side gutter. */
export function hasGutterRoom(viewportWidth: number): boolean {
  return viewportWidth >= minViewportForGutterRoaming();
}

/**
 * Pick a random point in the side gutter (guaranteed outside the centered
 * content column) — only valid when hasGutterRoom() is true. Callers must
 * check that first; see fixedCornerPoint() for the narrow-viewport case.
 */
export function randomSafePoint(viewportWidth: number, viewportHeight: number): Point {
  const size = companionSizeFor(viewportWidth);
  const gutter = (viewportWidth - CONTENT_MAX_WIDTH) / 2;
  const usableGutterWidth = gutter - EDGE_INSET * 2;
  const onLeft = Math.random() < 0.5;
  const gutterX = EDGE_INSET + Math.random() * Math.max(0, usableGutterWidth - size);
  const x = onLeft ? gutterX : viewportWidth - gutterX - size;

  const bandTop = NAVBAR_CLEARANCE;
  const bandBottom = Math.max(bandTop + size, viewportHeight - EDGE_INSET - size);
  const y = bandTop + Math.random() * (bandBottom - bandTop);
  return { x, y };
}

/**
 * A single fixed corner pocket for viewports too narrow to have a safe
 * roaming gutter. Pinned to the true bottom-right of the VIEWPORT (like a
 * chat-widget FAB), not somewhere "in" the page — since content is
 * edge-to-edge and single-column here, any mid-screen row will cross body
 * text on some page/scroll position. The bottom edge is the only spot that
 * reads as "a corner badge" rather than "sitting on a paragraph." App.css
 * reserves real empty space below the footer on mobile specifically so
 * this corner is genuinely (not just probably) clear of content — see the
 * `.site-footer` rule inside `@media (max-width: 767px)`.
 */
export function fixedCornerPoint(viewportWidth: number, viewportHeight: number): Point {
  const size = companionSizeFor(viewportWidth);
  return {
    x: Math.max(EDGE_INSET, viewportWidth - EDGE_INSET - size),
    y: Math.max(NAVBAR_CLEARANCE, viewportHeight - EDGE_INSET - size),
  };
}

/** TRUE edge peek: most of the container hangs OFF-SCREEN and only
 * `exposure` (0..1) of it stays visible — the peek clip's own lean-out does
 * the reveal, so the mascot genuinely appears from behind the viewport edge.
 * Off-screen positions are trivially safe (nothing to overlap). */
export function peekEdgePoint(viewportWidth: number, viewportHeight: number, exposure: number): Point {
  const size = companionSizeFor(viewportWidth);
  const fromLeft = Math.random() < 0.5;
  const y = NAVBAR_CLEARANCE + Math.random() * Math.max(0, viewportHeight - NAVBAR_CLEARANCE - EDGE_INSET - size);
  const hidden = size * (1 - exposure);
  const x = fromLeft ? -hidden : viewportWidth - size + hidden;
  return { x, y };
}

/** Fully-hidden point just past the nearest side edge — the peek's duck-away
 * target. Once the mascot settles here it is invisible, which is the one
 * place an instant relocate is legitimate (nobody can see a hidden hop). */
export function offscreenHidePoint(from: Point, viewportWidth: number): Point {
  const size = companionSizeFor(viewportWidth);
  const nearLeft = from.x + size / 2 < viewportWidth / 2;
  return { x: nearLeft ? -(size + 8) : viewportWidth + 8, y: from.y };
}

/**
 * Additive capability for per-page context beats (§5 of the behavior
 * taxonomy): "stand next to this real element" rather than a random gutter
 * point. Reuses `getBoundingClientRect()` — the exact pattern HomePage's
 * talking-anchor already uses safely for `.hero-portrait-wrapper` — so this
 * is proven-safe, not a new measurement strategy. Deliberately does NOT
 * replace `randomSafePoint`/`fixedCornerPoint`: those remain the only
 * "legal roam zone" definitions; this only picks WHERE within/near that
 * legality to stand for a moment, clamped back into the gutter/corner so a
 * targeted element positioned mid-column never pulls the companion over text.
 */
export function targetedAnchorPoint(
  el: Element,
  viewportWidth: number,
  viewportHeight: number,
  side: 'left' | 'right' = 'right'
): Point {
  const size = companionSizeFor(viewportWidth);
  const rect = el.getBoundingClientRect();
  const canRoam = hasGutterRoom(viewportWidth);

  if (!canRoam) {
    // No safe gutter to stand in near the element — hold the same fixed
    // corner every other in-place behavior uses on narrow viewports, so the
    // reserved-padding safety guarantee (App.css .site-footer) is never
    // bypassed by a targeted beat.
    return fixedCornerPoint(viewportWidth, viewportHeight);
  }

  const gutter = (viewportWidth - CONTENT_MAX_WIDTH) / 2;
  const gutterLeftX = EDGE_INSET;
  const gutterRightX = viewportWidth - EDGE_INSET - size;
  const x = side === 'left' && gutter > size + EDGE_INSET ? gutterLeftX : gutterRightX;

  const bandTop = NAVBAR_CLEARANCE;
  const bandBottom = Math.max(bandTop + size, viewportHeight - EDGE_INSET - size);
  const y = clampToRange(rect.top + rect.height / 2 - size / 2, bandTop, bandBottom);
  return { x, y };
}

function clampToRange(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
