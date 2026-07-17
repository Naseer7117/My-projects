import React from 'react';
import { m, useMotionValue, useSpring, MotionValue, Variants } from 'framer-motion';
import { CompanionBehavior, CompanionGait, WalkArc } from 'hooks/interactions/useCompanionBehavior';
import AnimatedMascotPlayer, { PoseKey, POSES, warmUpMascotSources } from 'components/effects/AnimatedMascotPlayer';
import { hasFinePointer, prefersReducedMotion } from 'lib/env';
import {
  COMPANION_BREATHE_PERIOD_S,
  COMPANION_BREATHE_LIFT_PX,
  COMPANION_DRIFT_PERIOD_S,
  COMPANION_DRIFT_PX,
  COMPANION_SIT_DOWN_MS,
  COMPANION_ARC_HEIGHT_PER_PX,
  COMPANION_ARC_MIN_PX,
  COMPANION_ARC_MAX_PX,
  COMPANION_ARC_LEAN_DEG,
  COMPANION_TILT_RADIUS_PX,
  COMPANION_TILT_MAX_ROTATE_X_DEG,
  COMPANION_TILT_MAX_ROTATE_Y_DEG,
} from 'lib/constants';

/*
 * CompanionCharacter — the roaming mascot, rendered once, globally, in
 * App.tsx.
 *
 * CONTAINER-PHYSICS RENDERER over an ANIMATED-SOURCE PLAYER: the asset layer
 * (which file shows for a behavior — animated WebP when checked in, static
 * PNG fallback, future transparent <video>; facing normalization; ~150ms
 * crossfades) lives in AnimatedMascotPlayer.tsx. This component maps the
 * behavior FSM's outputs onto that player plus a wrapper chain where each
 * layer owns exactly ONE motion concern:
 *
 *   .companion            m.div — x/y position springs (FSM-owned), facing
 *                          classes, --stride-phase target (rootRef)
 *     .companion__stage   m.div — pseudo-3D cursor tilt (rotateX/rotateY
 *                          springs + perspective): the mascot subtly "looks
 *                          toward" a nearby pointer
 *       .companion__squash m.div — behavior variants: anticipation crouch
 *                          (scaleY 0.85), recovery impact-stretch settle, the
 *                          celebration bounce. Bouncy 200/10 springs,
 *                          feet-anchored origin.
 *         .companion__bob div — walking-only, written per frame: the
 *                          distance-synced stride bounce (foot-plants every
 *                          COMPANION_STRIDE_LENGTH_PX of REAL travel) PLUS
 *                          the whole-crossing parabolic hop arc
 *                          (-apex·sin(π·walkProgress), lean into travel) —
 *                          both purely visual offsets; the position springs
 *                          alone own ground truth + arrival detection
 *           .companion__float m.div — stationary life: breathing y-loop, and
 *                          in true idle an extra ±2px x drift (~7s) so the
 *                          mascot floats rather than pins
 *             <AnimatedMascotPlayer> — the crossfading media element(s)
 *
 * The behavior FSM underneath (useCompanionBehavior.ts) is unchanged: this
 * component only maps its outputs to an asset + container physics.
 */

/** Behaviors whose pose gets the stationary breathing loop (true idle gets
 * the floaty x-drift variant on top — see floatStateFor). Walking uses the
 * stride bob + arc instead; anticipation/recovery hold still for the squash
 * tell; celebrating has its own bounce. */
const BREATHING_BEHAVIORS: ReadonlySet<CompanionBehavior> = new Set<CompanionBehavior>([
  'idle',
  'sitting',
  'sittingCross',
  'peeking',
  'waving',
  'highFive',
  'talking',
]);

function poseForBehavior(
  behavior: CompanionBehavior,
  gait: CompanionGait,
  peekSide: 'left' | 'right',
  idleSub: string | null,
  sitSettled: boolean
): PoseKey {
  switch (behavior) {
    case 'walking':
      return gait === 'run' ? 'run' : gait === 'climb' ? 'climb' : 'walk';
    case 'sitting':
      // Two-pose composition: the stand-to-seated transition one-shot first,
      // then (COMPANION_SIT_DOWN_MS later) the seated-idle loop.
      return sitSettled ? 'sit' : 'sitDown';
    case 'sittingCross':
      return 'sit';
    case 'peeking':
      return peekSide === 'right' ? 'peekAlt' : 'peek';
    case 'waving':
      return 'wave';
    case 'highFive':
      return 'highfive';
    case 'hopping':
      // Perch missions: the celebratory hop at the far end of a traversed
      // element border (also the jump clip's second life beyond the idle sub).
      return 'jump';
    case 'celebrating':
      return 'celebrate';
    case 'talking':
      return 'pointing';
    case 'idle': {
      // The FSM's Tier-B idle pool occasionally rolls a sub with its own
      // video-derived animation — that hold plays the variant clip instead of
      // the base idle loop. Every other sub keeps the base loop (it already
      // breathes and blinks). Only true idle (not anticipation/recovery,
      // which must stay visually still for the squash tell to read).
      const idleSubPose: Record<string, PoseKey> = {
        stretch: 'idleStretch',
        doze: 'idleDoze',
        dance: 'idleDance',
        exercise: 'idleExercise',
        think: 'idleThink',
        laugh: 'idleLaugh',
        hop: 'jump',
      };
      return (idleSub && idleSubPose[idleSub]) || 'idle';
    }
    case 'anticipation':
      return 'idle';
    case 'recovery':
      // Keep showing the gait clip through the arrival settle. Cutting to
      // idle here flashed a third pose for 260ms between the walk and its
      // arrival action — the "rapid cutting" the pacing overhaul removes.
      return gait === 'run' ? 'run' : gait === 'climb' ? 'climb' : 'walk';
    default:
      return 'idle';
  }
}

// Squash-and-stretch + celebration bounce, applied to the image wrapper via
// variants (feet-anchored transform-origin in CSS so it pushes up from the
// ground). Walking keeps 'rest' — the stride bob wrapper owns walk motion.
type SquashState = 'rest' | 'crouch' | 'settle' | 'cheer';

// Deliberately underdamped (ζ ≈ 0.35): every squash release overshoots and
// wobbles once before settling, which is what sells rubbery cartoon weight.
const SQUASH_SPRING = { type: 'spring', stiffness: 200, damping: 10 } as const;

const SQUASH_VARIANTS: Variants = {
  rest: {
    scaleX: 1,
    scaleY: 1,
    y: 0,
    transition: SQUASH_SPRING,
  },
  // Anticipation: crouch tell before the first step. The same bouncy spring
  // plays it in AND back out (crouch -> walking releases through 'rest',
  // overshooting into a brief launch stretch for free).
  crouch: {
    scaleX: 1.1,
    scaleY: 0.85,
    y: 0,
    transition: SQUASH_SPRING,
  },
  // Recovery: arrival impact — snap to the stretch peak (same 0.95/1.08
  // scale values as ever, now as a two-keyframe spring origin) and let the
  // underdamped spring wobble it back to rest.
  settle: {
    scaleX: [0.95, 1],
    scaleY: [1.08, 1],
    y: 0,
    transition: SQUASH_SPRING,
  },
  // Celebration: strong scale pulse + hop. This bounce (plus the celebrate
  // art's own sparkle swirl) deliberately REPLACES the requested screen
  // shake — shaking the whole viewport is an accessibility hazard and fights
  // the site's reduced-motion discipline.
  cheer: {
    scaleX: [1, 1.18, 1, 1.12, 1],
    scaleY: [1, 1.18, 1, 1.12, 1],
    y: [0, -12, 0, -7, 0],
    transition: { duration: 1.15, times: [0, 0.22, 0.5, 0.72, 1], ease: 'easeInOut' },
  },
};

function squashStateFor(behavior: CompanionBehavior): SquashState {
  if (behavior === 'anticipation') return 'crouch';
  if (behavior === 'recovery') return 'settle';
  if (behavior === 'celebrating') return 'cheer';
  return 'rest';
}

// Stationary life on the float wrapper (NOT the media element — the player's
// x is its -50% centering, and the wrapper outliving pose crossfades means
// the breath never restarts mid-cycle on a swap).
type FloatState = 'still' | 'breathe' | 'float';

const FLOAT_VARIANTS: Variants = {
  still: {
    x: 0,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  // Arrival actions (sit/peek/wave/high-five/talk): breathing only.
  breathe: {
    x: 0,
    y: [0, -COMPANION_BREATHE_LIFT_PX, 0],
    transition: {
      x: { duration: 0.2, ease: 'easeOut' },
      y: { duration: COMPANION_BREATHE_PERIOD_S, ease: 'easeInOut', repeat: Infinity },
    },
  },
  // True idle: breathing PLUS a very subtle horizontal drift so standing
  // still reads weightless, not pinned. Amplitude is 2px on purpose — it may
  // never visually contradict the safe-zone standing point.
  float: {
    x: [0, COMPANION_DRIFT_PX, 0, -COMPANION_DRIFT_PX, 0],
    y: [0, -COMPANION_BREATHE_LIFT_PX, 0],
    transition: {
      x: { duration: COMPANION_DRIFT_PERIOD_S, ease: 'easeInOut', repeat: Infinity },
      y: { duration: COMPANION_BREATHE_PERIOD_S, ease: 'easeInOut', repeat: Infinity },
    },
  },
};

function floatStateFor(behavior: CompanionBehavior): FloatState {
  if (behavior === 'idle') return 'float';
  return BREATHING_BEHAVIORS.has(behavior) ? 'breathe' : 'still';
}

type CompanionCharacterProps = {
  behavior: CompanionBehavior;
  /** 'run' swaps the walk pose for the run pose on long crossings. */
  gait: CompanionGait;
  /** Tier-B idle sub-pick from the FSM — subs with their own clip (stretch/
   * doze/dance/exercise/think/laugh/hop) route to that animation while
   * idling; every other value keeps the base idle loop. */
  idleSub: string | null;
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** -1 = facing left, 1 = facing right (FSM velocity-derived). */
  facing: MotionValue<number>;
  /** 0..1 wrapping stride phase, written every frame by useCompanionBehavior's
   * distance-tracking loop WHILE behavior === 'walking'. No longer consumed
   * here — every gait's footsteps are baked into its clip now — but kept in
   * the contract as the hook for any future distance-synced effect. */
  strideRef: React.RefObject<number>;
  /** Live walk telemetry (progress 0..1 / planned px / direction) from the
   * same FSM loop — drives the purely visual hop arc. */
  walkArcRef: React.RefObject<WalkArc>;
  /** Forwarded to the root .companion div so useCompanionBehavior's loop can
   * write the --stride-phase custom property there each frame. */
  rootRef: React.RefObject<HTMLDivElement | null>;
};

const CompanionCharacter: React.FC<CompanionCharacterProps> = ({
  behavior,
  gait,
  idleSub,
  x,
  y,
  facing,
  walkArcRef,
  rootRef,
}) => {
  React.useEffect(() => {
    warmUpMascotSources();
  }, []);

  // --- sitting's two-pose timing: play the stand-to-seated transition
  // one-shot, then settle into the seated-idle loop. Purely visual — the FSM
  // knows one 'sitting' behavior. StrictMode-safe: re-running just replays
  // the transition from its start, which is also the correct visual. ---
  const [sitSettled, setSitSettled] = React.useState(false);
  React.useEffect(() => {
    if (behavior !== 'sitting') {
      setSitSettled(false);
      return;
    }
    const t = window.setTimeout(() => setSitSettled(true), COMPANION_SIT_DOWN_MS);
    return () => window.clearTimeout(t);
  }, [behavior]);

  // --- pseudo-3D cursor tilt: pointer within COMPANION_TILT_RADIUS_PX maps
  // its offset to rotateY/rotateX (springs for smoothness) so the mascot
  // "looks toward" the cursor. Its own tiny pointermove listener: this is a
  // renderer-level concern, and useCompanionCursorEncounter's listener lives
  // behind the FSM boundary where these motion values don't belong. ---
  const tiltXTarget = useMotionValue(0);
  const tiltYTarget = useMotionValue(0);
  const rotateX = useSpring(tiltXTarget, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(tiltYTarget, { stiffness: 180, damping: 18 });

  React.useEffect(() => {
    if (typeof window === 'undefined' || !hasFinePointer() || prefersReducedMotion()) return;
    const onMove = (e: PointerEvent) => {
      const size = rootRef.current?.offsetWidth || 72;
      const dx = e.clientX - (x.get() + size / 2);
      const dy = e.clientY - (y.get() + size / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < COMPANION_TILT_RADIUS_PX && dist > 0.0001) {
        // Fade the effect back out toward the rim so leaving the radius
        // never steps; peak lean lands mid-radius.
        const falloff = 1 - dist / COMPANION_TILT_RADIUS_PX;
        tiltYTarget.set((dx / COMPANION_TILT_RADIUS_PX) * COMPANION_TILT_MAX_ROTATE_Y_DEG * (0.4 + 0.6 * falloff));
        tiltXTarget.set((-dy / COMPANION_TILT_RADIUS_PX) * COMPANION_TILT_MAX_ROTATE_X_DEG * (0.4 + 0.6 * falloff));
      } else {
        tiltYTarget.set(0);
        tiltXTarget.set(0);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      tiltXTarget.set(0);
      tiltYTarget.set(0);
    };
  }, [x, y, rootRef, tiltXTarget, tiltYTarget]);

  // --- walk motion, written per frame while walking:
  //
  //   hop arc — one gentle parabola across the WHOLE crossing:
  //   arcY = -apex·sin(π·progress), progress = fraction of planned distance
  //   covered (FSM walkArcRef), apex = planned·COMPANION_ARC_HEIGHT_PER_PX
  //   clamped to [ARC_MIN, ARC_MAX]; plus a ±3° lean INTO the travel
  //   direction scaled by the same sin — strongest mid-arc, zero at both
  //   ends.
  //
  //   The old procedural stride bob/rock is GONE: every gait is a baked
  //   video cycle now, and layering a synthetic dip over baked footsteps
  //   visibly doubled the bounce. The arc stays — it shapes the whole
  //   crossing, a path-level concern no in-place cycle can bake. The climb
  //   gait gets NO offsets at all: a vertical clamber shouldn't hop or lean.
  //
  //   A PURELY VISUAL offset on this wrapper — the x/y position springs
  //   alone own ground-truth position and arrival detection.
  const bobRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = bobRef.current;
    if (!node) return;
    if (behavior !== 'walking' || gait === 'climb') {
      node.style.transform = '';
      return;
    }
    let rafId = 0;
    let running = false;
    const tick = () => {
      const { progress, plannedDistancePx, dirX, suppressArc } = walkArcRef.current;
      if (suppressArc) {
        // Surface leg (perch border/ramp): feet stay planted on the line —
        // no hop arc, no lean.
        node.style.transform = '';
        if (running) rafId = requestAnimationFrame(tick);
        return;
      }
      const apex = Math.min(
        COMPANION_ARC_MAX_PX,
        Math.max(COMPANION_ARC_MIN_PX, plannedDistancePx * COMPANION_ARC_HEIGHT_PER_PX)
      );
      const lift = Math.sin(Math.PI * progress); // 0 at launch/arrival, 1 mid-crossing
      const arcY = -apex * lift;
      const lean = COMPANION_ARC_LEAN_DEG * dirX * lift;
      node.style.transform = `translateY(${arcY.toFixed(2)}px) rotate(${lean.toFixed(2)}deg)`;
      if (running) rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
      node.style.transform = '';
    };
  }, [behavior, gait, walkArcRef]);

  // Which edge a peek plays from — decides both the asset (peek vs peekAlt)
  // and its flip. Position is settled by the time 'peeking' starts, so a
  // plain read here is safe.
  const peekSide: 'left' | 'right' =
    behavior === 'peeking' && typeof window !== 'undefined' && x.get() > window.innerWidth / 2 ? 'right' : 'left';

  const poseKey = poseForBehavior(behavior, gait, peekSide, idleSub, sitSettled);
  const pose = POSES[poseKey];
  const staticScaleX = pose.facingMode === 'edge' ? (peekSide === 'left' ? -1 : 1) : 1;

  return (
    <m.div className={`companion companion--${behavior}`} style={{ x, y }} aria-hidden="true" ref={rootRef}>
      <m.div className="companion__stage" style={{ rotateX, rotateY, transformPerspective: 600 }}>
        <m.div className="companion__squash" variants={SQUASH_VARIANTS} initial="rest" animate={squashStateFor(behavior)}>
          <div className="companion__bob" ref={bobRef}>
            <m.div className="companion__float" variants={FLOAT_VARIANTS} initial={false} animate={floatStateFor(behavior)}>
              <AnimatedMascotPlayer poseKey={poseKey} facing={facing} staticScaleX={staticScaleX} />
            </m.div>
          </div>
        </m.div>
      </m.div>
    </m.div>
  );
};

export default CompanionCharacter;
