import { useCallback, useMemo, useRef } from 'react';
import { COMPANION_IDLE_SUBS } from '../../lib/constants';

/*
 * useCompanionIdlePool — Tier B idle-variety picking.
 *
 * Tier A ("which named behavior to enter next while idle") no longer exists
 * as a real choice: sitting/sittingCross/peeking are reachable ONLY as a
 * walk's arrival action now (see useCompanionBehavior.ts's requestWalk),
 * never a random idle pick — so there is nothing left to weight-pick between.
 * What remains, and is genuinely still random every idle hold, is Tier B:
 * WHICH idle sub-animation plays while resting (blink/look-around/weight-
 * shift/rock/smile/stretch/yawn/foot-tap). Idle is picked disproportionately
 * often (it is now the ONLY default-layer state), so without sub-variety it
 * would loop the same breathing cycle every single time — picked uniformly
 * from COMPANION_IDLE_SUBS, EXCLUDING whichever sub-animation played last
 * time (tracked in a ref, filtered out before the random pick) — the "no
 * immediate repeat" rule.
 */

export type CompanionIdlePool = {
  pickIdleSub: () => (typeof COMPANION_IDLE_SUBS)[number];
};

export function useCompanionIdlePool(): CompanionIdlePool {
  const lastIdleSub = useRef<(typeof COMPANION_IDLE_SUBS)[number] | null>(null);

  // Stable function identity (useCallback) + stable object identity
  // (useMemo) are BOTH required here, not just style: useCompanionBehavior's
  // enterIdle -> enterRecoveryThenSettle -> onArrival callback chain
  // includes `idlePool` in a dependency array that ultimately gates the
  // distance-tracking rAF loop's own effect. A fresh `{ pickIdleSub }`
  // object on every render (as this used to return) gives `onArrival` a new
  // identity every render, which tears down and restarts that rAF loop
  // every render instead of letting it run continuously — on an app with
  // other frequently-re-rendering effects, this was enough to make the loop
  // never survive long enough to observe 2 consecutive "settled" frames,
  // permanently stranding the companion in `walking` at its arrival point.
  const pickIdleSub = useCallback((): (typeof COMPANION_IDLE_SUBS)[number] => {
    const candidates = COMPANION_IDLE_SUBS.filter((sub) => sub !== lastIdleSub.current);
    const pool = candidates.length ? candidates : COMPANION_IDLE_SUBS;
    const next = pool[Math.floor(Math.random() * pool.length)];
    lastIdleSub.current = next;
    return next;
  }, []);

  return useMemo(() => ({ pickIdleSub }), [pickIdleSub]);
}
