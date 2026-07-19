import { useEffect, useReducer, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import { hasFinePointer, prefersReducedMotion } from '../../lib/env';
import {
  COMPANION_NOTICE_RADIUS,
  COMPANION_NOTICE_DEBOUNCE_MS,
  COMPANION_APPROACH_DELAY_MS,
  COMPANION_APPROACH_OFFSET,
  COMPANION_ACKNOWLEDGE_MS,
  COMPANION_GREET_COOLDOWN_MS,
  COMPANION_HIGHFIVE_RADIUS,
} from '../../lib/constants';
import { Point } from '../../lib/companionZones';
import { companionSizeFor } from '../../lib/companionConfig';
import { WalkRequest, WalkArrivalAction } from './useCompanionBehavior';

/*
 * useCompanionCursorEncounter — the TRIMMED cursor interaction: a lingering
 * cursor is noticed, the companion walks over to a spot near it (via the
 * real Walk FSM — requestWalk, the SAME entry point the idle scheduler and
 * context beats use), then plays a single acknowledge gesture and returns
 * to idle. The previous flee/hide/chase escalation is deleted entirely —
 * no chase-radius tracking, no fleeing/hiding states, no cooldown.
 *
 * This hook no longer OWNS the walk — it only decides WHEN to call
 * requestWalk({ arrival: 'waving', ... }), then gets out of the way; the FSM
 * in useCompanionBehavior.ts handles anticipation/walking/arrival-detection/
 * recovery/hold/return-to-idle uniformly for every caller.
 *
 * Reuses `useCursorFx`'s `fine`-pointer gate (hasFinePointer()) so touch
 * devices never enter this machine at all — there's no cursor to react to.
 * Runs its OWN lightweight pointermove listener rather than reading
 * useCursorFx's `--mx`/`--my` CSS vars (a style read every frame is
 * layout-thrashy); this matches the existing "each effect hook owns its own
 * concern" pattern already used by useCursorFx vs useCompanionBehavior.
 */

type EncounterState = { phase: 'dormant' } | { phase: 'noticing'; since: number } | { phase: 'cooldown' };

type EncounterAction = { type: 'notice'; now: number } | { type: 'walked' } | { type: 'reset' };

function reducer(state: EncounterState, action: EncounterAction): EncounterState {
  switch (action.type) {
    case 'notice':
      if (state.phase !== 'dormant') return state;
      return { phase: 'noticing', since: action.now };
    case 'walked':
      // Once we've handed the walk off to the FSM, go dormant — the FSM
      // (anticipation -> walk -> acknowledge -> idle) owns the rest of the
      // sequence; this hook doesn't need to track it any further.
      return { phase: 'dormant' };
    case 'reset':
      return { phase: 'dormant' };
    default:
      return state;
  }
}

/**
 * @param requestWalk        the FSM's shared walk entry point (useCompanionBehavior)
 * @param isIdleNow          returns true only when the FSM is genuinely idle —
 *                            gates noticing so a cursor encounter never
 *                            interrupts a walk/context-beat already in flight
 */
export function useCompanionCursorEncounter(
  x: MotionValue<number>,
  y: MotionValue<number>,
  enabled: boolean,
  requestWalk: (req: WalkRequest) => void,
  isIdleNow: () => boolean
): void {
  const [state, dispatch] = useReducer(reducer, { phase: 'dormant' });
  const noticingSince = useRef<number | null>(null);
  /** When the last greet fired — a long cooldown keeps a lingering cursor
   * from making him wave on loop (read as a glitch in the live demo). */
  const lastGreetAt = useRef<number>(-Infinity);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (!hasFinePointer() || prefersReducedMotion()) return;

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const cx = x.get();
      const cy = y.get();
      const size = companionSizeFor(window.innerWidth); // companion footprint for distance purposes
      const centerX = cx + size / 2;
      const centerY = cy + size / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (state.phase === 'dormant') {
        if (!isIdleNow()) return; // never interrupt an in-flight walk/context-beat
        if (now - lastGreetAt.current < COMPANION_GREET_COOLDOWN_MS) return; // one greet, then a long breather
        if (dist < COMPANION_NOTICE_RADIUS) {
          if (noticingSince.current === null) noticingSince.current = now;
          if (now - noticingSince.current >= COMPANION_NOTICE_DEBOUNCE_MS) {
            dispatch({ type: 'notice', now });
          }
        } else {
          noticingSince.current = null;
        }
      } else if (state.phase === 'noticing') {
        if (dist >= COMPANION_NOTICE_RADIUS) {
          dispatch({ type: 'reset' });
          noticingSince.current = null;
        } else if (now - state.since >= COMPANION_APPROACH_DELAY_MS) {
          const offsetX = e.clientX + (dx < 0 ? COMPANION_APPROACH_OFFSET : -COMPANION_APPROACH_OFFSET) - size / 2;
          const offsetY = e.clientY - size / 2;
          const target: Point = { x: offsetX, y: offsetY };
          // A pointer already right on top of us at greet time upgrades the
          // wave to a high-five; a merely-nearby one gets the wave. This is
          // the ONLY branch — no chase/flee reintroduction.
          const arrival: WalkArrivalAction = dist < COMPANION_HIGHFIVE_RADIUS ? 'highFive' : 'waving';
          requestWalk({ target, arrival, expression: 'happy', holdMs: COMPANION_ACKNOWLEDGE_MS });
          lastGreetAt.current = now;
          dispatch({ type: 'walked' });
          noticingSince.current = null;
        }
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, state, x, y, requestWalk, isIdleNow]);
}
