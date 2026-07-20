import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue, useSpring, useVelocity, MotionValue } from 'framer-motion';
import { prefersReducedMotion } from '../../lib/env';
import {
  randomSafePoint,
  fixedCornerPoint,
  variedRestPoint,
  hasGutterRoom,
  peekEdgePoint,
  offscreenHidePoint,
  Point,
} from '../../lib/companionZones';
import {
  findPerchTarget,
  measurePerchSpan,
  perchApproachSide,
  gutterRampPoint,
  findClimbTarget,
  measureClimbSpan,
  climbRungs,
} from '../../lib/companionPerch';
import { companionSizeFor, COMPANION_SIZE_DESKTOP, COMPANION_MOBILE_BREAKPOINT } from '../../lib/companionConfig';
import {
  COMPANION_BEHAVIOR_MIN_MS,
  COMPANION_BEHAVIOR_MAX_MS,
  COMPANION_ANTICIPATION_MS,
  COMPANION_RECOVERY_MS,
  COMPANION_ARRIVAL_DISTANCE_PX,
  COMPANION_ARRIVAL_VELOCITY_PX_S,
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
  COMPANION_PEEK_CHANCE,
  COMPANION_TRAVERSE_STEP_PX,
  COMPANION_TRAVERSE_STEP_HOLD_MS,
  COMPANION_CLIMB_CHANCE,
  COMPANION_CLIMB_SUMMIT_HOLD_MS,
  COMPANION_CLIMB_RUNG_PX,
  COMPANION_CLIMB_RUNG_HOLD_MS,
  COMPANION_NAP_AFTER_MS,
  COMPANION_NAP_RECHECK_MS,
  COMPANION_WAKE_REACTION_SUB,
  COMPANION_WAKE_LOCKOUT_MS,
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
 * WALK rAF LOOP: a per-frame loop (see the effect below) runs ONLY while
 * behavior === 'walking', reading the spring's live x/y each frame. It does
 * two things: (1) updates walkArcRef.progress (remaining-distance fraction)
 * for the renderer's visual hop arc, and (2) arrival detection — distance-to-
 * target AND speed both under threshold for 2 consecutive frames fires
 * arrival. (The old distance-accumulated stride phase is gone — every gait's
 * footsteps are baked into its clip now, so nothing consumed it.)
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
  /** Force a specific gait clip regardless of the leg's distance/steepness.
   * Needed for climb RUNGS: each rung is short (~46px) so the auto steep-check
   * (needs >220px vertical) would pick 'walk' — this pins it to 'climb'. */
  forceGait?: CompanionGait;
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
  /** True while this leg walks ALONG a surface (perch border/ramp legs) —
   * the renderer must not add the hop arc; feet stay planted on the line. */
  suppressArc: boolean;
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
  /** Visible bottom-origin scale (perch fit-to-element shrink, 1 = full size).
   * A ref so the renderer reads it per-frame without re-rendering. */
  perchScaleRef: React.RefObject<number>;
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
  if (hasGutterRoom(w)) return randomSafePoint(w, h);
  // No side gutter (near-full-width content). On mobile hold the fixed corner;
  // on desktop pick a VARIED bottom-band point so he actually moves around
  // between missions instead of pinning to one corner.
  return w <= COMPANION_MOBILE_BREAKPOINT ? fixedCornerPoint(w, h) : variedRestPoint(w, h);
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
  const walkArcRef = useRef<WalkArc>({ progress: 0, plannedDistancePx: 0, dirX: 1, suppressArc: false });
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
    | {
        kind: 'walk';
        req: WalkRequest;
        anchorEl?: Element | null;
        /** Which end of the anchored span this leg aims at (scroll re-aim). */
        anchorAim?: 'start' | 'end';
        /** Surface leg (border/ramp): renderer suppresses the hop arc. */
        onSurface?: boolean;
        /** Visible scale for this leg (perch fit-to-element shrink, 1 = full). */
        perchScale?: number;
        /** The fit SIZE (px) this leg was measured at — re-used by scroll re-anchor. */
        perchSize?: number;
        /** Pause (ms) to hold BEFORE starting this leg — spaces out the stepped
         * traverse so he reads as walk-stop-walk across a wide element. */
        pauseMs?: number;
        /** Which behavior/gait to HOLD during pauseMs. Default 'idle' (a plain
         * stop). For a climb, hold 'climbing' so a rung-pause reads as gripping
         * the ladder mid-climb, not standing idle mid-air. */
        pauseGait?: CompanionGait;
      }
    | { kind: 'relocate' };
  const missionRef = useRef<MissionStep[]>([]);
  /** Element the CURRENT step is glued to (perch traverse/hop) — its rect is
   * re-measured on scroll so the mascot tracks the page moving under it. */
  const missionAnchorRef = useRef<Element | null>(null);
  const missionAnchorAimRef = useRef<'start' | 'end'>('end');
  const suppressArcRef = useRef(false);
  /** Visible bottom-origin scale for the current leg — read by the renderer
   * (CompanionCharacter) so the mascot shrinks to fit a tight perch with his
   * feet staying planted. 1 = full size. */
  const perchScaleRef = useRef(1);
  /** The fit size (px) of the active anchored leg — the scroll re-anchor
   * re-measures the span at this size so start/end x stay correct. */
  const missionSizeRef = useRef(COMPANION_SIZE_DESKTOP);
  /** The element a CLIMB mission depends on staying on-screen. Climb legs are
   * fixed points (a vertical clamber can't cheaply scroll-re-anchor like a
   * horizontal top-edge perch), so if the user scrolls the photo away mid-climb
   * the climb would carry on in empty space (owner: "he kept climbing on a card
   * after I scrolled"). While this is set, the scroll handler ABORTS the mission
   * the moment the element leaves the climbable band, and he settles somewhere
   * valid. Null for non-climb missions. */
  const missionClimbElRef = useRef<Element | null>(null);

  /** True from the moment a mission's first step is consumed until the whole
   * queue drains (including the relocate settle, when missionRef is already
   * empty but a hidden hop is still pending). Guards one-shot pre-emptions
   * like celebration from firing mid-mission — otherwise a click during the
   * peek relocate's 350ms hidden-settle would cancel the relocate and cheer
   * off-screen. */
  const missionActiveRef = useRef(false);
  const clearMission = useCallback(() => {
    missionRef.current = [];
    missionAnchorRef.current = null;
    missionClimbElRef.current = null;
    suppressArcRef.current = false;
    perchScaleRef.current = 1; // restore full size on any teardown
    missionActiveRef.current = false;
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
      missionActiveRef.current = false; // queue drained — mission fully over
      return false;
    }
    missionActiveRef.current = true;
    if (step.kind === 'walk') {
      missionAnchorRef.current = step.anchorEl ?? null;
      missionAnchorAimRef.current = step.anchorAim ?? 'end';
      suppressArcRef.current = step.onSurface ?? false;
      perchScaleRef.current = step.perchScale ?? 1;
      if (step.perchSize) missionSizeRef.current = step.perchSize;
      const startLeg = () => {
        missionStepInFlightRef.current = true;
        requestWalkRef.current(step.req);
        missionStepInFlightRef.current = false;
      };
      if (step.pauseMs && step.pauseMs > 0) {
        // Hold before this leg so the stepped traverse reads as stop-go.
        // Default hold is a plain idle stop; a climb rung instead HOLDS the
        // climb pose (pauseGait 'climb') so the grip-pause looks like he's
        // clinging to the ladder mid-climb, not standing idle in mid-air.
        // clearPhaseTimeout on any pre-emption cancels this pending leg cleanly.
        if (step.pauseGait) {
          setGait(step.pauseGait);
          setBehavior('walking');
        } else {
          setBehavior('idle');
        }
        phaseTimeoutRef.current = window.setTimeout(startLeg, step.pauseMs);
      } else {
        startLeg();
      }
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
    // Genuine idle (mission fully drained): force full size. Belt-and-braces so
    // a shrunk perch scale can NEVER leak into a standing/idle/peek pose — the
    // renderer eases perchScaleRef back to 1 from here.
    perchScaleRef.current = 1;
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
    // settledFrames is WALK-SCOPED — it must reset the instant a NEW walk
    // begins (fsmPhase -> 'walking'), not just when this effect first mounts
    // (the effect runs once: x/y/xVelocity/yVelocity are stable MotionValue
    // identities). `wasWalking` detects that fresh entry.
    let settledFrames = 0;
    let wasWalking = false;

    const tick = () => {
      const isWalking = fsmPhaseRef.current === 'walking';
      if (isWalking && !wasWalking) {
        // Fresh entry into walking — reset the arrival counter and measure
        // the walk-arc baseline from THIS position.
        settledFrames = 0;
        // Walk-arc baseline: planned distance + direction are fixed per walk,
        // measured from THIS spot (the true launch point — anticipation may
        // have drifted the spring a hair, so don't trust requestWalk's math).
        const plannedWalk = activeWalkRef.current;
        if (plannedWalk) {
          const pdx = plannedWalk.target.x - x.get();
          const pdy = plannedWalk.target.y - y.get();
          walkArcRef.current.plannedDistancePx = Math.sqrt(pdx * pdx + pdy * pdy);
          walkArcRef.current.dirX = pdx >= 0 ? 1 : -1;
        } else {
          walkArcRef.current.plannedDistancePx = 0;
        }
        walkArcRef.current.progress = 0;
        walkArcRef.current.suppressArc = suppressArcRef.current;
      }
      wasWalking = isWalking;

      if (isWalking) {
        const curX = x.get();
        const curY = y.get();
        // (The old distance-accumulating stride phase / --stride-phase CSS var
        // is gone — every gait's footsteps are baked into its clip now, so
        // nothing consumed the phase. strideRef stays in the return contract
        // as a harmless hook for any future distance-synced effect.)

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
          // Compare SQUARED velocity to avoid a sqrt every frame (distToTarget
          // keeps its sqrt — it's consumed for the progress fraction above).
          const speedSq = xVelocity.get() ** 2 + yVelocity.get() ** 2;
          const withinDistance = distToTarget < COMPANION_ARRIVAL_DISTANCE_PX;
          const withinVelocity = speedSq < COMPANION_ARRIVAL_VELOCITY_PX_S ** 2;
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
        req.forceGait ?? // caller pins the gait (climb rungs are short — auto-steep would miss them)
          (isSteep
            ? 'climb'
            : Math.sqrt(planDx * planDx + planDy * planDy) >
                window.innerWidth * COMPANION_RUN_DISTANCE_VIEWPORT_FRACTION
              ? 'run'
              : 'walk')
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

  // --- inactivity tracking for the nap (doze-in-place) branch above ---
  const lastActivityRef = useRef(Date.now());
  const nappingRef = useRef(false);
  /** Timestamp until which napping is forbidden — set on every wake, so a
   * jittery cursor can't ping-pong him in and out of sleep. */
  const napLockoutUntilRef = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (nappingRef.current) {
        // Wake up: play the wake reaction (a stretch), lock out further naps
        // for a minute, then resume normal idling.
        nappingRef.current = false;
        napLockoutUntilRef.current = Date.now() + COMPANION_WAKE_LOCKOUT_MS;
        if (fsmPhaseRef.current === 'idle') {
          setIdleSub(idlePool.peekSpecific(COMPANION_WAKE_REACTION_SUB));
          scheduleIdleRef.current();
        }
      }
    };
    window.addEventListener('pointermove', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
  }, [enabled, idlePool]);

  /** Idle-hold duration: normally random (4-8s). When the nap threshold will
   * pass DURING this hold, shorten it so the scheduler re-checks right at that
   * moment and dozes promptly, instead of a chain of perch missions
   * overshooting it. Never shorter than 300ms, and only shortens (a hold
   * already past the threshold keeps its normal length — the nap check in the
   * scheduler fires this tick anyway). */
  const idleHoldMs = useCallback((): number => {
    const untilNapEligible = lastActivityRef.current + COMPANION_NAP_AFTER_MS - Date.now();
    const hold = randomHoldMs();
    return untilNapEligible > 300 && untilNapEligible < hold ? untilNapEligible : hold;
  }, []);

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

      // INACTIVITY: total silence for a while (and not inside a post-wake
      // lockout) -> doze off IN PLACE (no wandering while nobody's watching);
      // any activity wakes him (listener above). Re-checked on a timer so the
      // nap persists.
      if (
        Date.now() - lastActivityRef.current > COMPANION_NAP_AFTER_MS &&
        Date.now() > napLockoutUntilRef.current
      ) {
        nappingRef.current = true;
        setIdleSub('doze');
        idleTimeoutRef.current = window.setTimeout(() => {
          if (fsmPhaseRef.current === 'idle') scheduleIdleRef.current();
        }, COMPANION_NAP_RECHECK_MS);
        return;
      }
      nappingRef.current = false;

      const roll = Math.random();
      // Perch and peek walk on element top-borders / screen edges, so they
      // work at ANY content width — they do NOT need a side gutter. Only the
      // plain-roam fallback below needs a gutter (else the fixed corner).
      // This is what keeps the mascot moving now that content is near-full-
      // width and the old side gutters are gone.
      const perch = findPerchTarget(w, h);

      // CLIMB MISSION (special-cased sub-branch of the perch window): when the
      // tall hero portrait is on-screen, sometimes clamber UP its LEFT edge like
      // a ladder instead of walking a top border. The vertical leg is steep, so
      // requestWalk's gait detector auto-plays the climb clip; onSurface: true
      // suppresses the hop arc so his feet track the edge like rungs. Fixed
      // points (not scroll-re-anchored) — the climb is brief and the hero sits
      // at the top of the page. Ramp to the bottom-left corner, climb to the
      // top-left corner, hold a "made it up" beat, then descend and settle.
      const climbEl = roll < COMPANION_PERCH_CHANCE ? findClimbTarget(w, h) : null;
      if (climbEl && Math.random() < COMPANION_CLIMB_CHANCE) {
        const { bottom, top } = measureClimbSpan(climbEl, w, h);
        const groundRamp = gutterRampPoint('left', bottom.y, w);
        // Break the vertical run into RUNGS so it reads as deliberate,
        // step-by-step ladder climbing (a single spring leg eases out and
        // stalls ~10% short before the summit beat — the "climbs fast then
        // stops early" bug). Each rung is a short steep leg (climb gait), with
        // a grip-hold BEFORE it that holds the climb pose (pauseGait 'climb').
        // The LAST up-rung === top, so he always reaches the real top; only
        // there does he do the summit hop.
        const upRungs = climbRungs(bottom, top, COMPANION_CLIMB_RUNG_PX);
        const downRungs = climbRungs(top, bottom, COMPANION_CLIMB_RUNG_PX);
        const climbLeg = (target: Point, isFirst: boolean, summit: boolean): MissionStep => ({
          kind: 'walk',
          req: summit
            ? { target, arrival: 'hopping', expression: 'happy', holdMs: COMPANION_CLIMB_SUMMIT_HOLD_MS, forceGait: 'climb' }
            : { target, arrival: 'idle', forceGait: 'climb' }, // short rung — pin climb (auto steep-check needs >220px)
          onSurface: true,
          // No grip-hold before the very first rung (he's just stepped onto the
          // ladder); every later rung pauses gripping the ladder.
          pauseMs: isFirst ? undefined : COMPANION_CLIMB_RUNG_HOLD_MS,
          pauseGait: 'climb',
        });
        missionRef.current = [
          { kind: 'walk', req: { target: groundRamp, arrival: 'idle' } },
          { kind: 'walk', req: { target: bottom, arrival: 'idle' } }, // step to the foot of the ladder
          // Climb UP rung by rung; the final rung lands on the top and hops.
          ...upRungs.map((pt, i) =>
            climbLeg(pt, i === 0, i === upRungs.length - 1 /* summit on the last */)
          ),
          // Climb back DOWN rung by rung, then walk off and settle.
          ...downRungs.map((pt, i) => climbLeg(pt, i === 0, false)),
          { kind: 'walk', req: { target: pickStandingPoint(), arrival: 'idle' } },
        ];
        // Bind the mission to the photo: if the user scrolls it out of the
        // climbable band, the scroll handler aborts the climb (else he'd carry
        // on clambering in empty space over whatever scrolled into view).
        missionClimbElRef.current = climbEl;
        consumeMissionStep();
        return;
      }

      // PERCH MISSION (the default idle stroll when a target is on-screen):
      // ramp in from the side -> step onto the border's near end -> traverse
      // the top edge -> hop -> ramp off -> settle. Surface legs suppress the
      // hop arc so his feet stay planted on the line. A perch roll with NO
      // target falls straight to plain roam (never to peek).
      if (perch && roll < COMPANION_PERCH_CHANCE) {
        const side = perchApproachSide(perch, w);
        const nearEnd = side === 'left' ? perch.start : perch.end;
        const farEnd = side === 'left' ? perch.end : perch.start;
        const nearAim = side === 'left' ? 'start' : 'end';
        const farAim = side === 'left' ? 'end' : 'start';
        const ramp = gutterRampPoint(side, nearEnd.y, w);
        const scale = perch.size / COMPANION_SIZE_DESKTOP; // 1 when he fits full-size, <1 when shrunk to a tight border

        // Traverse the top edge in STEPS so a wide element (like the hero
        // heading) reads as him actually WALKING across the whole thing at a
        // steady pace — a single spring leg over a long span darts across too
        // fast to see. Each step is ~COMPANION_TRAVERSE_STEP_PX of real travel
        // with a short pause, so he walk-stops-walks along the letters. Only
        // the first (near) and last (far) legs re-anchor to the live element
        // ends; intermediate steps are fixed points (the traverse is brief).
        //
        // STEP-BY-STEP traverse (owner wants the walk to read as real steps, not
        // a glide). The wide element is crossed in short legs each with a
        // grip-pause, so he walk-stops-walks. MOBILE keeps two adjustments: the
        // far-end HOP is dropped (on a narrow heading it launched him off the
        // letters — "jumping far off the text"), and the step size is smaller so
        // even a short heading span still gets a few gentle steps rather than
        // one dart. He still STOPS on the far end (arrival 'idle') feet planted.
        const isMobile = w <= COMPANION_MOBILE_BREAKPOINT;
        const stepPx = isMobile ? COMPANION_TRAVERSE_STEP_PX * 0.6 : COMPANION_TRAVERSE_STEP_PX;
        const span = Math.abs(farEnd.x - nearEnd.x);
        const steps = Math.max(1, Math.round(span / stepPx));
        const surfaceLegs: MissionStep[] = [
          { kind: 'walk', req: { target: nearEnd, arrival: 'idle' }, anchorEl: perch.el, anchorAim: nearAim, onSurface: true, perchScale: scale, perchSize: perch.size },
        ];
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const mid: Point = { x: nearEnd.x + (farEnd.x - nearEnd.x) * t, y: nearEnd.y + (farEnd.y - nearEnd.y) * t };
          // pauseMs makes him stop briefly BEFORE each step — walk, stop, walk
          // across the letters instead of one fast dart.
          surfaceLegs.push({ kind: 'walk', req: { target: mid, arrival: 'idle' }, onSurface: true, perchScale: scale, perchSize: perch.size, pauseMs: COMPANION_TRAVERSE_STEP_HOLD_MS });
        }
        surfaceLegs.push({
          kind: 'walk',
          req: { target: farEnd, arrival: isMobile ? 'idle' : 'hopping', expression: 'happy' },
          anchorEl: perch.el,
          anchorAim: farAim,
          onSurface: true,
          perchScale: scale,
          perchSize: perch.size,
        });

        missionRef.current = [
          { kind: 'walk', req: { target: ramp, arrival: 'idle' } },
          ...surfaceLegs,
          { kind: 'walk', req: { target: gutterRampPoint(side, nearEnd.y, w), arrival: 'idle' }, onSurface: true },
          { kind: 'walk', req: { target: pickStandingPoint(), arrival: 'idle' } },
        ];
        consumeMissionStep();
        return;
      }

      // TRUE EDGE PEEK MISSION: a DISJOINT slice ABOVE the perch window, so a
      // perch roll can never collapse into a peek. Slide mostly off-screen,
      // let the peek clip's lean-out do the reveal, duck away, then invisibly
      // relocate to re-emerge elsewhere.
      if (roll >= COMPANION_PERCH_CHANCE && roll < COMPANION_PERCH_CHANCE + COMPANION_PEEK_CHANCE) {
        const peekAt = peekEdgePoint(w, h, COMPANION_PEEK_EXPOSURE);
        missionRef.current = [
          { kind: 'walk', req: { target: peekAt, arrival: 'peeking', expression: 'surprised' } },
          { kind: 'walk', req: { target: offscreenHidePoint(peekAt, w), arrival: 'idle' } },
          { kind: 'relocate' },
        ];
        consumeMissionStep();
        return;
      }

      // pickStandingPoint handles both cases (gutter roam, or varied bottom-band
      // rest with no gutter), so this plain-roam fallback covers all widths.
      requestWalk({ target: pickStandingPoint(), arrival: 'idle' });
    }, idleHoldMs());
  }, [requestWalk, consumeMissionStep, idleHoldMs]);

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
      // CLIMB abort: a climb is bound to the photo but its rung legs are fixed
      // points (a vertical clamber can't cheaply scroll-re-anchor like a
      // horizontal top-edge perch). Any scroll moves the photo out from under
      // the fixed climb points, so the clamber would carry on in mid-air over
      // whatever scrolled into view (owner: "he kept climbing on a card after I
      // scrolled to the bottom"). So on ANY scroll during a climb, cancel the
      // whole mission and walk to a valid standing point for the NEW page state.
      // Checked before the perch re-anchor below.
      if (missionClimbElRef.current) {
        const phase = fsmPhaseRef.current;
        if (phase === 'walking' || phase === 'arrived' || phase === 'anticipation') {
          clearMission();
          clearPhaseTimeout();
          activeWalkRef.current = null;
          requestWalkRef.current({ target: pickStandingPoint(), arrival: 'idle' });
          return;
        }
      }
      const el = missionAnchorRef.current;
      if (!el) return;
      const phase = fsmPhaseRef.current;
      if (phase !== 'walking' && phase !== 'arrived' && phase !== 'anticipation') return;
      const span = measurePerchSpan(el, window.innerWidth, missionSizeRef.current);
      const aim = missionAnchorAimRef.current === 'start' ? span.start : span.end;
      if (activeWalkRef.current) activeWalkRef.current.target = aim;
      targetX.set(aim.x);
      targetY.set(aim.y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled, targetX, targetY, clearMission, clearPhaseTimeout]);

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
    // Refuse mid-mission: during the peek relocate's hidden settle the phase
    // reads 'idle' but a hidden hop is still pending — celebrating here would
    // cancel it and play the cheer off-screen. missionActiveRef covers that
    // gap (missionRef is already empty by then).
    if (missionActiveRef.current) return;
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
      perchScaleRef,
      requestWalk,
    }),
    [enabled, behavior, idleSub, expression, gait, x, y, facing, requestWalk]
  );
}
