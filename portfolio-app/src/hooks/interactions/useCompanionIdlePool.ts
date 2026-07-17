import { useCallback, useMemo, useRef } from 'react';
import { COMPANION_IDLE_SUBS } from '../../lib/constants';

/*
 * useCompanionIdlePool — Tier B idle-variety picking, as a FAIR SHUFFLE BAG.
 *
 * Tier A ("which named behavior to enter next while idle") no longer exists:
 * sitting/sittingCross/peeking are reachable ONLY as a walk's arrival action
 * now (see useCompanionBehavior.ts's requestWalk). What remains is Tier B:
 * WHICH idle sub-animation plays while resting. Idle is the only default-
 * layer state, so it is picked constantly — without real variety it loops.
 *
 * FAIR SHUFFLE (replaces the old "uniform, just avoid the last one" rule,
 * which could still starve some clips for a long time and over-show others):
 * a shuffled QUEUE of all subs is consumed one at a time; when it empties it
 * reshuffles. So every sub plays exactly once per pass before any repeats —
 * even distribution, still feels random. The only stitch across a reshuffle
 * is a guard so the last clip of one bag isn't the first of the next (no
 * back-to-back repeat at the seam).
 */

export type IdleSub = (typeof COMPANION_IDLE_SUBS)[number];

export type CompanionIdlePool = {
  /** Next sub from the shuffle bag (reshuffles when exhausted). */
  pickIdleSub: () => IdleSub;
  /** Force a specific sub to be next (used by the nap controller for 'doze');
   * does not disturb the bag. */
  peekSpecific: (sub: IdleSub) => IdleSub;
};

function shuffled<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useCompanionIdlePool(): CompanionIdlePool {
  // The shuffle bag (consumed from the end) and the last sub handed out, so a
  // reshuffle never repeats across the seam.
  const bag = useRef<IdleSub[]>([]);
  const last = useRef<IdleSub | null>(null);

  // Stable function identity (useCallback) + stable object identity (useMemo)
  // are BOTH required, not style: useCompanionBehavior's enterIdle ->
  // enterRecoveryThenSettle -> onArrival chain includes `idlePool` in a dep
  // array that ultimately gates the distance-tracking rAF loop's effect. A
  // fresh object every render would tear down and restart that loop every
  // render, so it never survives 2 consecutive "settled" frames and the
  // companion strands in `walking`. Do NOT make these unstable.
  const pickIdleSub = useCallback((): IdleSub => {
    if (bag.current.length === 0) {
      let next = shuffled(COMPANION_IDLE_SUBS);
      // Avoid a seam repeat: if the new bag would hand out the same sub we
      // just played, swap it with another slot.
      if (next.length > 1 && next[next.length - 1] === last.current) {
        [next[next.length - 1], next[0]] = [next[0], next[next.length - 1]];
      }
      bag.current = next;
    }
    const sub = bag.current.pop() as IdleSub;
    last.current = sub;
    return sub;
  }, []);

  const peekSpecific = useCallback((sub: IdleSub): IdleSub => {
    last.current = sub;
    return sub;
  }, []);

  return useMemo(() => ({ pickIdleSub, peekSpecific }), [pickIdleSub, peekSpecific]);
}
