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
import { companionSizeFor, NAVBAR_CLEARANCE, EDGE_INSET } from 'lib/companionConfig';
import { Point } from 'lib/companionZones';

export type PerchSpan = {
  /** The element being perched on — kept so the FSM can re-measure it live. */
  el: Element;
  /** Left end of the walkable top edge, in mascot container coords. */
  start: Point;
  /** Right end of the walkable top edge. */
  end: Point;
};

/** Selectors worth standing on, in priority order. Broad on purpose — the
 * visibility + width filters below do the real gatekeeping. */
const PERCH_SELECTORS = [
  '.hero-portrait-wrapper', // profile image border (home)
  '.section-title', // section headings (h2)
  '.card', // skill / project / contact cards
];

/** The mascot's y when standing ON an element's top border: feet at the
 * border, body above it. The foot offset sinks the container slightly so the
 * feet (which sit above ~8px of transparent crop padding + shadow) visually
 * TOUCH the border instead of hovering over it. */
function perchY(rect: DOMRect, size: number): number {
  return rect.top - size + COMPANION_PERCH_FOOT_OFFSET_PX;
}

/** Which side gutter is the natural on/off ramp for this span. */
export function perchApproachSide(span: { start: Point; end: Point }, viewportWidth: number): 'left' | 'right' {
  const mid = (span.start.x + span.end.x) / 2;
  return mid < viewportWidth / 2 ? 'left' : 'right';
}

/** The gutter point at the SAME height as the perch — the routed entry/exit
 * ramp. Walking gutter → ramp → border keeps the whole approach along the
 * border's row instead of a diagonal beeline through paragraph text. */
export function gutterRampPoint(side: 'left' | 'right', y: number, viewportWidth: number): Point {
  const size = companionSizeFor(viewportWidth);
  return {
    x: side === 'left' ? EDGE_INSET : viewportWidth - EDGE_INSET - size,
    y: Math.max(NAVBAR_CLEARANCE, y),
  };
}

/** Re-measure a perch element into fresh start/end points — called at mission
 * build AND on every scroll while perched, so the mascot tracks the page. */
export function measurePerchSpan(el: Element, viewportWidth: number): { start: Point; end: Point } {
  const size = companionSizeFor(viewportWidth);
  const rect = el.getBoundingClientRect();
  const y = perchY(rect, size);
  return {
    start: { x: rect.left, y },
    end: { x: rect.right - size, y },
  };
}

/** A perch candidate is usable when its whole body sits inside the viewport
 * (with navbar clearance for the mascot standing on top) and its top edge is
 * wide enough for a walk to actually read as a walk. */
function isPerchable(el: Element, viewportWidth: number, viewportHeight: number): boolean {
  const size = companionSizeFor(viewportWidth);
  const rect = el.getBoundingClientRect();
  if (rect.width < COMPANION_PERCH_TRAVERSE_MIN_PX + size) return false;
  if (rect.top - size < NAVBAR_CLEARANCE) return false; // mascot on top must clear the navbar
  if (rect.bottom > viewportHeight) return false;
  if (rect.left < 0 || rect.right > viewportWidth) return false;
  return true;
}

/** Pick a random perchable element currently on screen, or null. */
export function findPerchTarget(viewportWidth: number, viewportHeight: number): PerchSpan | null {
  if (typeof document === 'undefined') return null;
  const candidates: Element[] = [];
  for (const selector of PERCH_SELECTORS) {
    document.querySelectorAll(selector).forEach((el) => {
      if (isPerchable(el, viewportWidth, viewportHeight)) candidates.push(el);
    });
  }
  if (!candidates.length) return null;
  const el = candidates[Math.floor(Math.random() * candidates.length)];
  const { start, end } = measurePerchSpan(el, viewportWidth);
  return { el, start, end };
}
