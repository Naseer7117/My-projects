import { useEffect, useRef } from 'react';
import { RouteKey } from '../../types';
import { CompanionExpression, WalkArrivalAction } from './useCompanionBehavior';
import { targetedAnchorPoint } from '../../lib/companionZones';
import { useRequestCompanionContextBeat } from './CompanionContext';

/*
 * useCompanionContextBeat — the per-page "arrival mark" wiring from the
 * behavior taxonomy spec §5. Each page calls this ONCE with its own
 * selector + desired arrival action; each picks ONE distinctive, well-
 * implemented context behavior rather than a scripted multi-step sequence:
 *
 *   About    — `sitting` beside the first .timeline-item ("settle in and read")
 *   Skills   — `peeking` near the first .skills-cluster-card
 *   Projects — `peeking` near the first .project-card--featured
 *   Contact  — `sitting` (longer hold) beside .contact-card
 *   Home     — NOT wired here; HomePage already has its own richer
 *              talking-handoff via CompanionContext (which outranks any
 *              context beat anyway), so a second competing beat there would
 *              only matter when narration is NOT active — deferred as
 *              low-value given Home's existing coverage.
 *
 * The request goes through the SAME real Walk FSM every other "go stand
 * somewhere" caller uses (useCompanionBehavior's requestWalk): it measures
 * the real DOM element (reusing the exact getBoundingClientRect() pattern
 * HomePage's talking-anchor already uses safely), turns it into a target
 * point, and hands a { target, behavior, ... } request to the shared
 * CompanionContext — useCompanionBehavior picks that request up and calls
 * requestWalk itself, so the companion genuinely walks there
 * (anticipation -> distance-synced walk -> arrival-detected -> recovery)
 * rather than snapping instantly to the spot.
 *
 * Guarded by a ref keyed on `route` so it fires once per page-mount landing
 * (the transition INTO this route), not on every re-render.
 */

export function useCompanionContextBeat(
  route: RouteKey,
  selector: string,
  behavior: Exclude<WalkArrivalAction, 'idle'>,
  opts: { expression?: CompanionExpression; ms?: number; side?: 'left' | 'right' } = {},
  enabled: boolean
): void {
  const requestContextBeat = useRequestCompanionContextBeat();
  const firedForRoute = useRef<RouteKey | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (firedForRoute.current === route) return;

    // Give the page a tick to mount its DOM before measuring the anchor element.
    //
    // The fired-guard is set inside the timeout callback (when the beat has
    // genuinely fired), NOT here at schedule time. Setting it at schedule
    // time breaks under React StrictMode's double-invoked effects: run #1
    // sets the guard and schedules, the simulated-unmount cleanup cancels
    // the timeout, run #2 then sees the guard already set and bails — so
    // the beat never fires at all on the dev server. Guarding at fire time
    // means run #2 simply reschedules (its timeout survives) and production
    // behavior (single invoke) is identical.
    const t = window.setTimeout(() => {
      firedForRoute.current = route;
      const el = document.querySelector(selector);
      if (!el) return;
      const target = targetedAnchorPoint(el, window.innerWidth, window.innerHeight, opts.side ?? 'right');
      requestContextBeat({
        behavior,
        expression: opts.expression,
        target,
        ms: opts.ms ?? 2200,
      });
    }, 260);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, route]);
}
