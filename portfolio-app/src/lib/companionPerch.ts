/*
 * companionPerch.ts — DOM-aware perching for the companion ("walk on text &
 * borders"). Finds real page elements worth standing on and turns their live
 * getBoundingClientRect() into mascot coordinates, so the FSM can walk the
 * mascot ALONG THE TOP EDGE of a card, heading, or the hero portrait.
 *
 * This deliberately relaxes the original gutter-only roaming rule — the owner
 * asked for genuine element interaction. The guardrails that remain:
 *   - only elements CURRENTLY fully visible in the viewport are candidates
 *     (a perch on a half-scrolled card would walk the mascot off to nowhere);
 *   - the mascot stands ABOVE the element (feet on its top border), so the
 *     element's own content is never covered — only the gap above it;
 *   - perch missions are brief (approach → traverse → hop → descend) and the
 *     FSM re-anchors the target's rect on scroll, so the mascot stays glued
 *     to the border even while the page moves under it;
 *   - pointer-events stay off — the mascot can never block a click.
 */
import { COMPANION_PERCH_TRAVERSE_MIN_PX, COMPANION_PERCH_FOOT_OFFSET_PX } from 'lib/constants';
import { companionSizeFor, COMPANION_SIZE_FIT_FLOOR, NAVBAR_CLEARANCE, EDGE_INSET } from 'lib/companionConfig';
import { Point } from 'lib/companionZones';

export type PerchSpan = {
  /** The element being perched on — kept so the FSM can re-measure it live. */
  el: Element;
  /** Left end of the walkable top edge, in mascot container coords. */
  start: Point;
  /** Right end of the walkable top edge. */
  end: Point;
  /** The (possibly shrunk-to-fit) VISIBLE size for this element — the mascot
   * scales to this so he fits a tight border instead of being skipped. The
   * container box stays full-size; this drives a bottom-origin scale. */
  size: number;
};

/** Selectors worth standing on, in priority order. Broad on purpose — the
 * visibility + width filters below do the real gatekeeping. */
const PERCH_SELECTORS = [
  '.hero-portrait-wrapper', // profile image border (home)
  '.hero-title', // the big "Hi, I am Naseeruddin Shaik" hero heading (home)
  '.section-title', // section headings (h2)
  '.card', // skill / project / contact cards
];

/** How far a text heading's visible glyphs overflow ABOVE its box top (the
 * font's ascent past the line box). Standing at box-top leaves the feet
 * floating this far above the letters, so for text targets we lift the perch
 * by this much to sit feet on the visible letters. Card/image borders ARE the
 * box top, so they get 0. */
const TEXT_ASCENT_LIFT_PX = 17;

/** Whether an element's perch line should hug its VISIBLE TEXT top (headings)
 * rather than its box top (cards, image borders). */
function isTextTarget(el: Element): boolean {
  const tag = el.tagName;
  return (
    tag === 'H1' ||
    tag === 'H2' ||
    tag === 'H3' ||
    el.classList.contains('hero-title') ||
    el.classList.contains('section-title')
  );
}

/** The mascot's y when standing ON an element's top border. The container box
 * is ALWAYS full-size (COMPANION_SIZE_DESKTOP) and the visible mascot is
 * bottom-origin scaled, so its feet always render at the container bottom =
 * y + fullSize regardless of the fit scale — so y is computed from the full
 * size, never the shrunk one. The foot offset sinks it so feet TOUCH the
 * border; for text headings we also lift by the glyph ascent so feet land on
 * the visible letters, not the box top. */
function perchY(rect: DOMRect, fullSize: number, textTarget: boolean): number {
  const lift = textTarget ? TEXT_ASCENT_LIFT_PX : 0;
  return rect.top - fullSize + COMPANION_PERCH_FOOT_OFFSET_PX - lift;
}

/** Largest size in [floor, default] at which the mascot fits this element's
 * walkable top edge (width + navbar clearance), or null if even the floor
 * won't fit. This is what makes movement never stop: a tight element shrinks
 * him instead of being skipped. */
function fitSizeFor(el: Element, viewportWidth: number, viewportHeight: number): number | null {
  const maxSize = companionSizeFor(viewportWidth); // 132 desktop / 76 mobile
  const rect = el.getBoundingClientRect();
  if (rect.left < 0 || rect.right > viewportWidth) return null; // element not fully on-screen horizontally
  // Fit constraints: walkable width needs TRAVERSE_MIN + size; and the mascot
  // stands in a FULL-size box above the border, so it needs full clearance
  // below the navbar and room to render on-screen (both keyed to full size,
  // since the box height doesn't shrink — only the visible width scales).
  if (rect.top - maxSize < NAVBAR_CLEARANCE) return null; // no room to stand above the border under the navbar
  if (rect.top > viewportHeight - maxSize) return null; // top border off-screen / no vertical room
  const widthFit = rect.width - COMPANION_PERCH_TRAVERSE_MIN_PX; // largest size the width allows
  const size = Math.min(maxSize, widthFit);
  if (size < COMPANION_SIZE_FIT_FLOOR) return null; // too narrow even at the floor
  return Math.floor(size);
}

/** Which side gutter is the natural on/off ramp for this span. */
export function perchApproachSide(span: { start: Point; end: Point }, viewportWidth: number): 'left' | 'right' {
  const mid = (span.start.x + span.end.x) / 2;
  return mid < viewportWidth / 2 ? 'left' : 'right';
}

/** The gutter point at the SAME height as the perch — the routed entry/exit
 * ramp. Walking gutter → ramp → border keeps the whole approach along the
 * border's row instead of a diagonal beeline through paragraph text. Uses the
 * FULL container size for the edge inset (the box is full-size; the ramp is a
 * plain off-element stand at scale 1). */
export function gutterRampPoint(side: 'left' | 'right', y: number, viewportWidth: number): Point {
  const size = companionSizeFor(viewportWidth);
  return {
    x: side === 'left' ? EDGE_INSET : viewportWidth - EDGE_INSET - size,
    y: Math.max(NAVBAR_CLEARANCE, y),
  };
}

/** Re-measure a perch element into fresh start/end points at a given fit size —
 * called at mission build AND on every scroll while perched. The container box
 * is full-size; the visible mascot is scaled to `size` and centered in the box
 * (bottom-center origin), so its visible left edge sits `(full - size)/2` in
 * from the container's left. We offset x so the VISIBLE feet walk from the
 * element's left edge to its right edge. y uses the FULL size (feet render at
 * the container bottom regardless of scale), clamped on-screen. */
export function measurePerchSpan(
  el: Element,
  viewportWidth: number,
  size: number,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
): { start: Point; end: Point } {
  const full = companionSizeFor(viewportWidth);
  const rect = el.getBoundingClientRect();
  const y = Math.max(NAVBAR_CLEARANCE, Math.min(perchY(rect, full, isTextTarget(el)), viewportHeight - full));
  const inset = (full - size) / 2; // horizontal margin from the box edge to the scaled mascot
  return {
    start: { x: rect.left - inset, y },
    end: { x: rect.right - full + inset, y },
  };
}

/** Pick a random perchable element on screen, shrinking the mascot to fit a
 * tight one rather than skipping it (so movement never stops). Null only when
 * NO element can hold him even at the floor size. */
export function findPerchTarget(viewportWidth: number, viewportHeight: number): PerchSpan | null {
  if (typeof document === 'undefined') return null;
  const candidates: { el: Element; size: number }[] = [];
  for (const selector of PERCH_SELECTORS) {
    document.querySelectorAll(selector).forEach((el) => {
      const size = fitSizeFor(el, viewportWidth, viewportHeight);
      if (size !== null) candidates.push({ el, size });
    });
  }
  if (!candidates.length) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const { start, end } = measurePerchSpan(chosen.el, viewportWidth, chosen.size, viewportHeight);
  return { el: chosen.el, start, end, size: chosen.size };
}
