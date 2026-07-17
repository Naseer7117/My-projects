import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue, useSpring, useVelocity, MotionValue } from 'framer-motion';
import { prefersReducedMotion } from '../../lib/env';
import {
  randomSafePoint,
  fixedCornerPoint,
  hasGutterRoom,
  peekEdgePoint,
  offscreenHidePoint,
  Point,
} from '../../lib/companionZones';
import { findPerchTarget, measurePerchSpan } from '../../lib/companionPerch';
import { companionSizeFor } from '../../lib/companionConfig';
import {
  COMPANION_BEHAVIOR_MIN_MS,
  COMPANION_BEHAVIOR_MAX_MS,
  COMPANION_ANTICIPATION_MS,
  COMPANION_RECOVERY_MS,
  COMPANION_ARRIVAL_DISTANCE_PX,
  COMPANION_ARRIVAL_VELOCITY_PX_S,
  COMPANION_STRIDE_LENGTH_PX,
  COMPANION_CELEBRATE_MS,
  COMPANION_RUN_DISTANCE_VIEWPORT_FRACTION,
  COMPANION_CLIMB_MIN_VERTICAL_PX,
  COMPANION_CLIMB_VERTICAL_RATIO,
  COMPANION_SPRING_STIFFNESS,
  COMPANION_SPRING_DAMPING,
  COMPANION_SPRING_MASS,
  COMPANION_ARRIVAL_MIN_HOLD_MS,
  COMPANION_PEEK_EXPOSURE,
  COMPANION_PEEK_DUCK_NOTICE_PX,
  COMPANION_PEEK_RELOCATE_SETTLE_MS,
  COMPANION_PERCH_CHANCE,
} from '../../lib/constants';
import {
  useCompanionHandoff,
  useCompanionContextBeatRequest,
  useCompanionCelebrationRequest,
} from './CompanionContext';
import { useCompanionIdlePool } from './useCompanionIdlePool';
import { useCompanionCursorEncounter } from './useCompanionCursorEncounter';

/*
 * useCompanionBehavior — the roaming companion's state machine.
 *
 * THE REAL WALK FSM (this is the rewrite's centerpiece):
 *
 *   Idle -> Anticipation -> Walking(distance-synced) -> Recovery -> {
 *     Sit | Peek | CursorAcknowledge | Idle
 *   }
 *
 * Anticipation and Recovery are real states with their own held pose and
 * duration (COMPANION_ANTICIPATION_MS / COMPANION_RECOVERY_MS) — the walk
 * no longer starts or stops instantly. Walking's DURATION is not a number
 * at all: it ends when arrival is DETECTED (see the stride/arrival rAF
 * effect below), by watching the live spring position, not a setTimeout
 * guessing how long the spring should take. This is the fix for the
 * original bug: a fixed COMPANION_WALK_MS timer used to flip the behavior
 * class independently of whatever the spring was actually doing, which is
 * what made it read as a floating sticker rather than a walking character.
 *
 * WHERE A WALK CAN LEAD: every "go stand somewhere and do something" caller
 * — the idle-pool default scheduler, AND a page's context-beat request —
 * goes through the exact same requestWalk() entry point below, so context
 * beats get real anticipation/walk/arrival/recovery too, not an instant
 * snap. sitting/sittingCross/peeking are ONLY reachable as the "then do X"
 * tail of a requestWalk() call (an arrival action) — never a random idle
 * pick (see useCompanionIdlePool.ts's now-trivial Tier A).
 *
 * PRIORITY: talking (CompanionContext handoff, e.g. Home's narration) is
 * the one thing that can pre-empt the walk FSM outright — it snaps position
 * directly since it's anchoring to a moving narration target, not a walk.
 * Below that, a cursor-encounter request and a context-beat request both
 * route through requestWalk(); whichever calls it last wins the target
 * (cursor encounters are transient and rare enough that this simple
 * last-write-wins is sufficient — see useCompanionCursorEncounter.ts).
 *
 * POSITION is two Framer Motion springs (x, y) following imperative
 * targetX/targetY motion values — retargeting mid-flight blends smoothly
 * from the current position AND velocity, never teleporting. This part was
 * already correct and is unchanged. `facing` is derived via useVelocity + a
 * manual deadzone-gated subscription — kept as a motion value, NEVER synced
 * to useState (would re-render up to 60x/sec).
 *
 * STRIDE-PHASE: a per-frame rAF loop (see the effect below) runs ONLY while
 * behavior === 'walking', reads the spring's live x/y each frame, accumulates
 * REAL distance traveled, and derives a 0..1 wrapping stride-phase from it
 * (distance / COMPANION_STRIDE_LENGTH_PX). That phase drives the pose-sprite
 * renderer's container bob (CompanionCharacter.tsx) instead of a CSS
 * keyframe running on animation-duration — the walk bounce is a function of
 * pixels covered, not milliseconds elapsed, so a spring that's temporarily
 * slowed by a retarget doesn't produce a bounce out of sync with the ground.
 * The SAME loop also does arrival detection: distance-to-target and speed
 * both under threshold for 2 consecutive frames fires arrival.
 */

export type CompanionBehavior =
  | 'idle'
  | 'anticipation'
  | 'walking'
  | 'recovery'
  | 'sitting'
  | 'sittingCross'
  | 'peeking'
  | 'waving'
  | 'highFive'
  | 'hopping'
  | 'celebrating'
  | 'talking';

export type CompanionExpression = 'neutral' | 'happy' | 'surprised' | 'focused' | 'content' | 'talking';

/** Which gait clip the current/last walk plays — decided once per requestWalk
 * from the planned travel: steep, vertically-dominated crossings climb, long
 * crossings run, everything else walks. Purely presentational: the
 * spring/stride mechanics are identical for all three. */
export type CompanionGait = 'walk' | 'run' | 'climb';

/** What the walk should do once it arrives — 'idle' means "just stop and
 * resume idling here," anything else is an arrival action (context beats,
 * the cursor encounter's acknowledge — 'highFive' when the pointer is close
 * enough at greet time, 'waving' otherwise). */
export type WalkArrivalAction = 'idle' | 'sitting' | 'sittingCross' | 'peeking' | 'waving' | 'highFive' | 'hopping';

export type WalkRequest = {
  target: Point;
  arrival: WalkArrivalAction;
  expression?: CompanionExpression;
  /** How long to hold the arrival action before falling back to idle (ms). Ignored when arrival === 'idle'. */
  holdMs?: number;
};

/** Per-frame walk-arc telemetry for the renderer's VISUAL hop-arc layer
 * (CompanionCharacter's bob wrapper). Written by the same rAF loop that owns
 * the stride phase — a ref, not state, for the identical no-rerender reason.
 * progress is remaining-distance based (1 − distToTarget/planned) so it hits
 * ~1 exactly when arrival detection fires, whatever the spring actually did. */
export type WalkArc = {
  /** 0..1 fraction of the planned crossing covered (clamped). */
  progress: number;
  /** Straight-line px from the walk's start point to its target — fixed per walk. */
  plannedDistancePx: number;
  /** Horizontal direction of the planned travel: 1 = rightward, -1 = leftward. */
  dirX: 1 | -1;
};

export type CompanionState = {
  enabled: boolean;
  behavior: CompanionBehavior;
  idleSub: string | null;
  expression: CompanionExpression;
  /** 'run' when the current/last walk covers a long crossing — the renderer
   * shows the run pose instead of the walk pose while walking. */
  gait: CompanionGait;
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** -1 (facing left) or 1 (facing right), derived from the x-spring's velocity. */
  facing: MotionValue<number>;
  /** 0..1 wrapping phase of the current stride cycle, written every animation
   * frame while walking — consumed by CompanionCharacter to drive the
   * foot-plant-synced container bob (distance-synced, not CSS
   * animation-duration synced). Exposed as a ref so reading it never
   * triggers a React re-render (identical reasoning to `facing`). */
  strideRef: React.RefObject<number>;
  /** Live walk-arc telemetry (progress / planned distance / direction) for
   * the renderer's visual hop arc — see WalkArc above. */
  walkArcRef: React.RefObject<WalkArc>;
  /** Attach to the companion's root DOM node so the stride loop can write
   * --stride-phase for any CSS that wants it, without needing a second
   * read path. */
  rootRef: React.RefObject<HTMLDivElement | null>;
  /** Imperatively request a walk-somewhere-and-do-X. Exposed so the two
   * priority-override sources (cursor encounter, context beat) can both
   * drive the SAME FSM rather than each inventing their own transition. */
  requestWalk: (req: WalkRequest) => void;
};

function randomHoldMs(): number {
  return COMPANION_BEHAVIOR_MIN_MS + Math.random() * (COMPANION_BEHAVIOR_MAX_MS - COMPANION_BEHAVIOR_MIN_MS);
}

/** The one guaranteed-safe spot to stand: the side gutter on wide viewports,
 * or a fixed bottom-right corner pocket when there's no gutter to roam. */
function pickStandingPoint(): Point {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return hasGutterRoom(w) ? randomSafePoint(w, h) : fixedCornerPoint(w, h);
}

// Velocity (px/s) below which we stop updating `facing` — prevents flicker
// from spring-settle jitter near the end of every move.
const FACING_VELOCITY_DEADZONE = 40;

type FsmPhase = 'idle' | 'anticipation' | 'walking' | 'recovery' | 'arrived';

/** Internal walk-in-progress bookkeeping, held in a ref (not state) since it
 * changes every animation frame during Walking — the arrival CALLBACK is
 * what triggers a state transition (a few times a second at most), not the
 * per-frame numbers themselves. */
type ActiveWalk = {
  target: Point;
  arrival: WalkArrivalAction;
  expression: CompanionExpression;
  holdMs: number;
};

export function useCompanionBehavior(): CompanionState {
  const handoff = useCompanionHandoff();
  const contextBeatRequest = useCompanionContextBeatRequest();
  const idlePool = useCompanionIdlePool();
  const reduced = prefersReducedMotion();
  const enabled = typeof window !== 'undefined' && !reduced;

  const [behavior, setBehavior] = useState<CompanionBehavior>('idle');
  const [idleSub, setIdleSub] = useState<string | null>(null);
  const [expression, setExpression] = useState<CompanionExpression>('neutral');
  const [gait, setGait] = useState<CompanionGait>('walk');

  const initial = useRef<Point>(enabled ? pickStandingPoint() : { x: 0, y: 0 });
  const targetX = useMotionValue(initial.current.x);
  const targetY = useMotionValue(initial.current.y);
  // Deliberately LAZY spring (see constants — pacing overhaul): travel slow
  // enough for the baked gait cycles to read as actual steps. Arrival
  // detection (distance + velocity thresholds, 2 consecutive frames) is
  // measurement-based, so the softer settle just means arrival fires a beat
  // later, it never flaps (arrival is one-way into recovery).
  const SPRING = {
    stiffness: COMPANION_SPRING_STIFFNESS,
    damping: COMPANION_SPRING_DAMPING,
    mass: COMPANION_SPRING_MASS,
  };
  const x = useSpring(targetX, SPRING);
  const y = useSpring(targetY, SPRING);

  const xVelocity = useVelocity(x);
  const yVelocity = useVelocity(y);
  const facing = useMotionValue(1);
  useEffect(() => {
    return xVelocity.on('change', (v) => {
      if (v > FACING_VELOCITY_DEADZONE) facing.set(1);
      else if (v < -FACING_VELOCITY_DEADZONE) facing.set(-1);
    });
  }, [xVelocity, facing]);

  const strideRef = useRef(0);
  const walkArcRef = useRef<WalkArc>({ progress: 0, plannedDistancePx: 0, dirX: 1 });
  const rootRef = useRef<HTMLDivElement>(null);

  // --- the FSM's own phase, separate from `behavior` (behavior is the CSS/
  // render-facing name; fsmPhase additionally distinguishes "arrived,
  // deciding what's next" without needing a throwaway extra behavior value) ---
  const fsmPhaseRef = useRef<FsmPhase>('idle');
  const activeWalkRef = useRef<ActiveWalk | null>(null);
  const phaseTimeoutRef = useRef<number | null>(null);

  const clearPhaseTimeout = useCallback(() => {
    if (phaseTimeoutRef.current !== null) {
      window.clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  }, []);

  // Forward-declared: assigned below once defined, referenced by the walk
  // start/step functions before its own definition runs (both live inside
  // the same effect closure, so this is just to satisfy TS's declaration
  // order within one function body).
  const scheduleIdleRef = useRef<() => void>(() => undefined);
  const requestWalkRef = useRef<(req: WalkRequest) => void>(() => undefined);

  // --- MISSIONS: short scripted step queues (perch on an element, true edge
  // peek) that ride the normal walk FSM. Each step runs when the previous
  // one fully completes (enterIdle consumes the queue before scheduling a
  // random idle), so every leg is a real spring walk with real arrival
  // detection — never a choreographed timer. Talking cancels outright. ---
  type MissionStep =
    | { kind: 'walk'; req: WalkRequest; anchorEl?: Element | null }
    | { kind: 'relocate' };
  const missionRef = useRef<MissionStep[]>([]);
  /** Element the CURRENT step is glued to (perch traverse/hop) — its rect is
   * re-measured on scroll so the mascot tracks the page moving under it. */
  const missionAnchorRef = useRef<Element | null>(null);

  const clearMission = useCallback(() => {
    missionRef.current = [];
    missionAnchorRef.current = null;
  }, []);
  /** True only for the synchronous moment a mission step itself calls
   * requestWalk — every OTHER caller (context beat, cursor encounter) is an
   * external pre-emption and cancels whatever mission was in flight. */
  const missionStepInFlightRef = useRef(false);

  /** Runs the next mission step if one is queued. Returns true when it took
   * over (the caller must NOT fall through to normal idle scheduling). */
  const consumeMissionStep = useCallback((): boolean => {
    const step = missionRef.current.shift();
    if (!step) {
      missionAnchorRef.current = null;
      return false;
    }
    if (step.kind === 'walk') {
      missionAnchorRef.current = step.anchorEl ?? null;
      missionStepInFlightRef.current = true;
      requestWalkRef.current(step.req);
      missionStepInFlightRef.current = false;
      return true;
    }
    // 'relocate': the mascot is fully hidden off-screen — the one place an
    // instant move is legitimate (nobody can watch a hidden hop). Springs
    // .jump() so no travel is animated, then normal idling resumes at the
    // new spot (it re-emerges from the edge on its next walk).
    missionAnchorRef.current = null;
    phaseTimeoutRef.current = window.setTimeout(() => {
      const fresh = hasGutterRoom(window.innerWidth)
        ? pickStandingPoint()
        : fixedCornerPoint(window.innerWidth, window.innerHeight);
      targetX.jump(fresh.x);
      targetY.jump(fresh.y);
      x.jump(fresh.x);
      y.jump(fresh.y);
      enterIdleRef.current();
    }, COMPANION_PEEK_RELOCATE_SETTLE_MS);
    return true;
  }, [targetX, targetY, x, y]);

  const enterIdleRef = useRef<() => void>(() => undefined);
  const enterIdle = useCallback(() => {
    clearPhaseTimeout();
    fsmPhaseRef.current = 'idle';
    activeWalkRef.current = null;
    if (consumeMissionStep()) return;
    setBehavior('idle');
    setIdleSub(idlePool.pickIdleSub());
    setExpression('neutral');
    scheduleIdleRef.current();
  }, [clearPhaseTimeout, idlePool, consumeMissionStep]);
  useEffect(() => {
    enterIdleRef.current = enterIdle;
  }, [enterIdle]);

  const enterRecoveryThenSettle = useCallback(() => {
    const walk = activeWalkRef.current;
    if (!walk) {
      enterIdle();
      return;
    }
    fsmPhaseRef.current = 'recovery';
    setBehavior('recovery');
    clearPhaseTimeout();
    phaseTimeoutRef.current = window.setTimeout(() => {
      const finished = activeWalkRef.current;
      if (!finished) {
        enterIdle();
        return;
      }
      if (finished.arrival === 'idle') {
        enterIdle();
        return;
      }
      // Arrival action: hold the named behavior, then fall back to idle.
      fsmPhaseRef.current = 'arrived';
      setBehavior(finished.arrival);
      setExpression(finished.expression);
      setIdleSub(null);
      clearPhaseTimeout();
      phaseTimeoutRef.current = window.setTimeout(() => {
        activeWalkRef.current = null;
        enterIdle();
      }, finished.holdMs);
    }, COMPANION_RECOVERY_MS);
  }, [clearPhaseTimeout, enterIdle]);

  const onArrival = useCallback(() => {
    if (fsmPhaseRef.current !== 'walking') return;
    enterRecoveryThenSettle();
  }, [enterRecoveryThenSettle]);

  // --- the distance-driven stride + arrival-detection loop ---
  // Runs ONLY while fsmPhase === 'walking'; gated on tab visibility and
  // prefers-reduced-motion exactly like this codebase's other rAF loops
  // (useCursorFx.ts, useScrollProgress.ts): cancelAnimationFrame in cleanup,
  // stopped on document.hidden, restarted on visibilitychange.
  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;
    let running = false;
    // lastX/lastY/strideAccumPx/settledFrames are all WALK-SCOPED — they
    // must reset the instant a NEW walk begins (fsmPhase transitions into
    // 'walking'), not just once when this effect first mounts. This effect
    // itself only runs once (x/y/xVelocity/yVelocity are stable MotionValue
    // references, never changing identity), so resetting these only at
    // startLoop()/mount time was the bug this comment replaces: on every
    // walk AFTER the first, lastX/lastY still held the position from
    // wherever the companion was several behaviors ago (it moves during
    // idle/anticipation/recovery too, just not tracked here), producing one
    // enormous spurious "step" at the start of every subsequent walk that
    // got summed into accumulated distance and corrupted the stride phase.
    // `wasWalking` below is what detects the fresh entry and resets state.
    let lastX = x.get();
    let lastY = y.get();
    let settledFrames = 0;
    let strideAccumPx = 0;
    let wasWalking = false;

    const tick = () => {
      const isWalking = fsmPhaseRef.current === 'walking';
      if (isWalking && !wasWalking) {
        // Fresh entry into walking (this walk's very first tracked frame) —
        // baseline against the CURRENT position, not stale leftovers from
        // whatever the companion was doing before.
        lastX = x.get();
        lastY = y.get();
        strideAccumPx = 0;
        settledFrames = 0;
        strideRef.current = 0;
        rootRef.current?.style.setProperty('--stride-phase', '0.0000');
        // Walk-arc baseline: planned distance + direction are fixed per walk,
        // measured from THIS spot (the true launch point — anticipation may
        // have drifted the spring a hair, so don't trust requestWalk's math).
        const plannedWalk = activeWalkRef.current;
        if (plannedWalk) {
          const pdx = plannedWalk.target.x - lastX;
          const pdy = plannedWalk.target.y - lastY;
          walkArcRef.current.plannedDistancePx = Math.sqrt(pdx * pdx + pdy * pdy);
          walkArcRef.current.dirX = pdx >= 0 ? 1 : -1;
        } else {
          walkArcRef.current.plannedDistancePx = 0;
        }
        walkArcRef.current.progress = 0;
      }
      wasWalking = isWalking;

      if (isWalking) {
        const curX = x.get();
        const curY = y.get();
        const dx = curX - lastX;
        const dy = curY - lastY;
        const stepDist = Math.sqrt(dx * dx + dy * dy);
        lastX = curX;
        lastY = curY;

        strideAccumPx += stepDist;
        const phase = (strideAccumPx % COMPANION_STRIDE_LENGTH_PX) / COMPANION_STRIDE_LENGTH_PX;
        strideRef.current = phase;
        rootRef.current?.style.setProperty('--stride-phase', phase.toFixed(4));

        const walk = activeWalkRef.current;
        if (walk) {
          const tdx = curX - walk.target.x;
          const tdy = curY - walk.target.y;
          const distToTarget = Math.sqrt(tdx * tdx + tdy * tdy);
          // Arc progress: remaining-distance based so it lands at ~1 exactly
          // when arrival detection (below) fires. Clamped — the spring's
          // overshoot can momentarily grow distToTarget again.
          const planned = walkArcRef.current.plannedDistancePx;
          walkArcRef.current.progress =
            planned > 0 ? Math.min(1, Math.max(0, 1 - distToTarget / planned)) : 1;
          const speedPxPerFrame = Math.sqrt(xVelocity.get() ** 2 + yVelocity.get() ** 2);
          const withinDistance = distToTarget < COMPANION_ARRIVAL_DISTANCE_PX;
          const withinVelocity = speedPxPerFrame < COMPANION_ARRIVAL_VELOCITY_PX_S;
          if (withinDistance && withinVelocity) {
            settledFrames += 1;
            if (settledFrames >= 2) {
              settledFrames = 0;
              onArrival();
            }
          } else {
            settledFrames = 0;
          }
        }
      }
      if (running) rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      lastX = x.get();
      lastY = y.get();
      rafId = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
    document.addEventListener('visibilitychange', onVisibility);
    startLoop();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopLoop();
    };
  }, [enabled, x, y, xVelocity, yVelocity, onArrival]);

  // --- requestWalk: the SINGLE entry point for "go stand somewhere and do
  // X" — used by the default idle-pool scheduler, the cursor encounter, and
  // context beats alike, so every caller gets the same real
  // Anticipation -> Walking(arrival-detected) -> Recovery -> action FSM. ---
  const requestWalk = useCallback(
    (req: WalkRequest) => {
      if (!enabled) return;
      if (!missionStepInFlightRef.current) clearMission();
      clearPhaseTimeout();
      activeWalkRef.current = {
        target: req.target,
        arrival: req.arrival,
        expression: req.expression ?? 'neutral',
        // Clamp every hold to the arrival pose's minimum so no clip is ever
        // crossfaded away mid-action, whatever the caller asked for.
        holdMs: Math.max(req.holdMs ?? 2200, COMPANION_ARRIVAL_MIN_HOLD_MS[req.arrival] ?? 0),
      };
      // Gait — decided here, once, from the planned travel (the one place
      // that knows both the start and the target): steep vertically-dominated
      // crossings play the climb clip, long crossings the run clip, the rest
      // the walk cycle.
      const planDx = req.target.x - x.get();
      const planDy = req.target.y - y.get();
      const isSteep =
        Math.abs(planDy) > COMPANION_CLIMB_MIN_VERTICAL_PX &&
        Math.abs(planDy) > Math.abs(planDx) * COMPANION_CLIMB_VERTICAL_RATIO;
      setGait(
        isSteep
          ? 'climb'
          : Math.sqrt(planDx * planDx + planDy * planDy) >
              window.innerWidth * COMPANION_RUN_DISTANCE_VIEWPORT_FRACTION
            ? 'run'
            : 'walk'
      );
      fsmPhaseRef.current = 'anticipation';
      setBehavior('anticipation');
      setIdleSub(null);
      setExpression('neutral');

      phaseTimeoutRef.current = window.setTimeout(() => {
        const walk = activeWalkRef.current;
        if (!walk) return;
        fsmPhaseRef.current = 'walking';
        setBehavior('walking');
        targetX.set(walk.target.x);
        targetY.set(walk.target.y);
      }, COMPANION_ANTICIPATION_MS);
    },
    [enabled, clearMission, clearPhaseTimeout, targetX, targetY, x, y]
  );
  useEffect(() => {
    requestWalkRef.current = requestWalk;
  }, [requestWalk]);

  // --- default: idle-pool scheduler. Alternates an idle hold with a
  // walk-somewhere-random via the SAME requestWalk FSM used everywhere
  // else — no bespoke instant-teleport path. Only active when the FSM is
  // genuinely idle (not mid-walk, not talking, not serving a context beat/
  // cursor encounter) — see the activeLayer gate below. ---
  const idleTimeoutRef = useRef<number | null>(null);
  const idlePausedRef = useRef(false);

  const scheduleIdle = useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (idlePausedRef.current) return;
    idleTimeoutRef.current = window.setTimeout(() => {
      if (fsmPhaseRef.current !== 'idle') return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const canRoam = hasGutterRoom(w);
      const roll = Math.random();

      // PERCH MISSION: walk onto a real page element, traverse its top
      // border, hop at the far end, hop back down to a legal roam point.
      // (Desktop-roaming viewports only — on the mobile corner layout the
      // mascot stays a corner buddy.)
      if (canRoam && roll < COMPANION_PERCH_CHANCE) {
        const perch = findPerchTarget(w, h);
        if (perch) {
          missionRef.current = [
            { kind: 'walk', req: { target: perch.start, arrival: 'idle' } },
            {
              kind: 'walk',
              req: { target: perch.end, arrival: 'hopping', expression: 'happy' },
              anchorEl: perch.el,
            },
            { kind: 'walk', req: { target: pickStandingPoint(), arrival: 'idle' } },
          ];
          consumeMissionStep();
          return;
        }
      }

      // TRUE EDGE PEEK MISSION: slide mostly off-screen, let the peek clip's
      // lean-out do the reveal, then duck fully away and (invisibly)
      // relocate — it re-emerges somewhere else entirely.
      if (canRoam && roll < COMPANION_PERCH_CHANCE + 0.18) {
        const peekAt = peekEdgePoint(w, h, COMPANION_PEEK_EXPOSURE);
        missionRef.current = [
          { kind: 'walk', req: { target: peekAt, arrival: 'peeking', expression: 'surprised' } },
          { kind: 'walk', req: { target: offscreenHidePoint(peekAt, w), arrival: 'idle' } },
          { kind: 'relocate' },
        ];
        consumeMissionStep();
        return;
      }

      const target = canRoam ? pickStandingPoint() : fixedCornerPoint(w, h);
      requestWalk({ target, arrival: 'idle' });
    }, randomHoldMs());
  }, [requestWalk, consumeMissionStep]);

  useEffect(() => {
    scheduleIdleRef.current = scheduleIdle;
  }, [scheduleIdle]);

  useEffect(() => {
    if (!enabled) return;
    scheduleIdle();
    const onVisibility = () => {
      idlePausedRef.current = document.hidden;
      if (document.hidden) {
        if (idleTimeoutRef.current !== null) {
          window.clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
      } else if (fsmPhaseRef.current === 'idle') {
        scheduleIdle();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    };
  }, [enabled, scheduleIdle]);

  // --- perch anchoring: while a mission step is glued to an element (the
  // traverse and the hop at its far end), every scroll re-measures the
  // element and re-aims BOTH the springs and the arrival-detection target,
  // so the mascot stays standing on the border while the page moves under
  // it. Passive listener; removed the moment no anchor is active. ---
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const el = missionAnchorRef.current;
      if (!el) return;
      const phase = fsmPhaseRef.current;
      if (phase !== 'walking' && phase !== 'arrived' && phase !== 'anticipation') return;
      const { end } = measurePerchSpan(el, window.innerWidth);
      if (activeWalkRef.current) activeWalkRef.current.target = end;
      targetX.set(end.x);
      targetY.set(end.y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled, targetX, targetY]);

  // --- peek duck-away: while actually holding a peek, a cursor that comes
  // close (or any scroll) cuts the hold short — enterIdle then consumes the
  // queued duck-offscreen step, so the mascot bolts behind the edge. Beat-
  // driven peeks (cards) have no queued duck step and simply resume idling. ---
  useEffect(() => {
    if (!enabled || behavior !== 'peeking') return;
    const duck = () => {
      if (fsmPhaseRef.current !== 'arrived') return;
      activeWalkRef.current = null;
      enterIdleRef.current();
    };
    const onMove = (e: PointerEvent) => {
      const size = companionSizeFor(window.innerWidth);
      const dx = e.clientX - (x.get() + size / 2);
      const dy = e.clientY - (y.get() + size / 2);
      if (Math.sqrt(dx * dx + dy * dy) < COMPANION_PEEK_DUCK_NOTICE_PX) duck();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', duck, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', duck);
    };
  }, [enabled, behavior, x, y]);

  // --- talking (highest priority — pre-empts the walk FSM outright) ---
  const wasTalkingRef = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (handoff.talking && handoff.anchor) {
      wasTalkingRef.current = true;
      clearMission();
      clearPhaseTimeout();
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      fsmPhaseRef.current = 'idle'; // parked, not literally idle-behavior — see behavior override just below
      activeWalkRef.current = null;
      setBehavior('talking');
      setExpression('talking');
      targetX.set(handoff.anchor.x);
      targetY.set(handoff.anchor.y);
    } else if (wasTalkingRef.current) {
      wasTalkingRef.current = false;
      enterIdle();
    }
  }, [enabled, handoff, clearMission, clearPhaseTimeout, targetX, targetY, enterIdle]);

  // --- context beat: routes through requestWalk exactly like every other
  // walk-somewhere source (plan §6 — no more instant snap-on-arrival). Each
  // beat fires once per nonce; skipped entirely while talking outranks it. ---
  const lastBeatNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || !contextBeatRequest || handoff.talking) return;
    if (lastBeatNonce.current === contextBeatRequest.nonce) return;
    lastBeatNonce.current = contextBeatRequest.nonce;
    requestWalk({
      target: contextBeatRequest.target,
      arrival: contextBeatRequest.behavior as WalkArrivalAction,
      expression: contextBeatRequest.expression as CompanionExpression | undefined,
      holdMs: contextBeatRequest.ms,
    });
  }, [enabled, contextBeatRequest, handoff.talking, requestWalk]);

  // --- celebration: a one-shot in-place cheer (no walk), fired by real
  // outbound-intent clicks (Projects repo/live links, Contact's Email-me) via
  // CompanionContext. Only plays when the FSM is parked (idle, or holding an
  // arrival action) — it never interrupts an in-flight walk, and talking
  // still outranks it. Nonce-gated exactly like the context beat. ---
  const celebrationRequest = useCompanionCelebrationRequest();
  const lastCelebrationNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || !celebrationRequest) return;
    if (lastCelebrationNonce.current === celebrationRequest.nonce) return;
    lastCelebrationNonce.current = celebrationRequest.nonce;
    if (handoff.talking) return;
    const phase = fsmPhaseRef.current;
    if (phase !== 'idle' && phase !== 'arrived') return;
    clearPhaseTimeout();
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    fsmPhaseRef.current = 'arrived'; // parked in a one-shot hold, same as other arrival actions
    activeWalkRef.current = null;
    setBehavior('celebrating');
    setExpression('happy');
    setIdleSub(null);
    phaseTimeoutRef.current = window.setTimeout(() => enterIdle(), COMPANION_CELEBRATE_MS);
  }, [enabled, celebrationRequest, handoff.talking, clearPhaseTimeout, enterIdle]);

  // --- cursor encounter: notice -> walk-over -> single acknowledge -> idle,
  // also routed through requestWalk. See useCompanionCursorEncounter.ts. ---
  useCompanionCursorEncounter(x, y, enabled && !handoff.talking, requestWalk, () => fsmPhaseRef.current === 'idle');

  return useMemo(
    () => ({
      enabled,
      behavior,
      idleSub,
      expression,
      gait,
      x,
      y,
      facing,
      strideRef,
      walkArcRef,
      rootRef,
      requestWalk,
    }),
    [enabled, behavior, idleSub, expression, gait, x, y, facing, requestWalk]
  );
}
