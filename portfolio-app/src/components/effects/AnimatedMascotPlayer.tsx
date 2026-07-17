import React from 'react';
import { AnimatePresence, m, MotionValue, useTransform } from 'framer-motion';
import { COMPANION_POSE_CROSSFADE_S } from 'lib/constants';

/*
 * AnimatedMascotPlayer — the mascot's ASSET layer.
 *
 * Every pose is a video-derived animated WebP (mascot-<state>-anim.webp) —
 * the static-PNG pose-swapping era is fully retired (owner's call, 2026-07-17:
 * "only the new implementation clips and movements should run"). Sources
 * resolve from the STATIC table below (no runtime HEAD probes — availability
 * is decided in code, at build time).
 *
 * Two source KINDS render:
 *
 *   'img'    <img>  — animated WebP loops natively as a plain <img> src,
 *                     alpha included ('loop=1' one-shots freeze on their
 *                     final frame)
 *   'video'  <video autoPlay loop muted playsInline> — for future
 *                     transparent .webm renders. No .webm is checked in yet;
 *                     the render path exists NOW so upgrading a state later
 *                     means only giving its POSES entry `kind: 'video'`.
 *
 * Crossfade: pose swaps mount a new keyed element through AnimatePresence
 * with a ~150ms linear opacity fade (COMPANION_POSE_CROSSFADE_S) — img and
 * video sources fade through the exact same variant props.
 *
 * Facing lives HERE (per media element) because it's an asset property:
 * final on-screen scaleX = desired facing × the art's own native facing.
 * Container physics (position springs, squash, walk arc, tilt, breathing)
 * stay in CompanionCharacter.tsx — this component never moves the mascot.
 */

export type PoseKey =
  | 'idle'
  | 'idleStretch'
  | 'idleDoze'
  | 'idleDance'
  | 'idleExercise'
  | 'idleThink'
  | 'idleLaugh'
  | 'walk'
  | 'run'
  | 'jump'
  | 'climb'
  | 'pointing'
  | 'peek'
  | 'peekAlt'
  | 'sit'
  | 'sitDown'
  | 'wave'
  | 'highfive'
  | 'celebrate';

/** How a pose's on-screen direction is decided:
 *  - 'locomotion': follow the FSM's velocity-derived facing (walk/run/greet)
 *  - 'edge':       decided by which screen edge is being peeked from
 *  - 'fixed':      never mirrored (frontal art, or direction-agnostic motion
 *                  like the vertical climb) */
export type FacingMode = 'locomotion' | 'edge' | 'fixed';

export type MascotSourceKind = 'img' | 'video';

export type PoseDef = {
  /** The pose's animated source (animated WebP today; .webm-ready). */
  src: string;
  kind: MascotSourceKind;
  /** Direction the ART faces as drawn: 1 = right, -1 = left. Final on-screen
   * scaleX = desiredFacing × nativeFacing for locomotion poses, so a
   * left-drawn pose shown while moving left needs NO flip. Ignored for
   * 'fixed' poses; 'edge' poses use the peek-side flip computed upstream. */
  nativeFacing: 1 | -1;
  facingMode: FacingMode;
};

const MASCOT_BASE = `${process.env.PUBLIC_URL || ''}/assets/mascot`;

const pose = (file: string, nativeFacing: 1 | -1, facingMode: FacingMode): PoseDef => ({
  src: `${MASCOT_BASE}/${file}`,
  kind: 'img',
  nativeFacing,
  facingMode,
});

/** The full pose table — every entry a video-derived clip. Loop clips repeat
 * natively; one-shots (noted) are encoded loop=1 and freeze on their final
 * frame until the FSM hold ends (holds are sized to outlive them — see
 * COMPANION_ACKNOWLEDGE_MS / COMPANION_CELEBRATE_MS / COMPANION_SIT_DOWN_MS). */
export const POSES: Record<PoseKey, PoseDef> = {
  // 6.5s breathing + blink loop — the mascot's resting heartbeat.
  idle: pose('mascot-idle-anim.webp', 1, 'fixed'),
  // Idle personality variants, reached only while their Tier-B idle sub is
  // active (routing lives in CompanionCharacter's poseForBehavior).
  idleStretch: pose('mascot-idle-stretch-anim.webp', 1, 'fixed'), // 2.2s one-shot
  idleLaugh: pose('mascot-idle-laugh-anim.webp', 1, 'fixed'), // 2.2s one-shot belly laugh
  idleDoze: pose('mascot-idle-doze-anim.webp', 1, 'fixed'), // 5.9s nod-off/startle loop
  idleDance: pose('mascot-idle-dance-anim.webp', 1, 'fixed'), // 6.4s happy dance loop
  idleExercise: pose('mascot-idle-exercise-anim.webp', 1, 'fixed'), // 3.7s squats loop
  idleThink: pose('mascot-idle-think-anim.webp', 1, 'fixed'), // 5.8s chin-tap loop
  // Locomotion gait cycles — mirrored at conversion to face RIGHT, so the
  // FSM's velocity-derived facing flips them exactly like the old art.
  // (NS chest badge reads true moving right, mirrored moving left — inherent
  // to any single-orientation locomotion art, and invisible at 96px.)
  walk: pose('mascot-walk-anim.webp', 1, 'locomotion'), // 3.6s cycle
  run: pose('mascot-run-anim.webp', 1, 'locomotion'), // 2.2s dash cycle
  // Vertical clamber cycle for the climb gait (steep walks). Direction-
  // agnostic — never mirrored.
  climb: pose('mascot-climb-anim.webp', 1, 'fixed'), // 2.4s loop
  // 1.9s crouch-jump-land one-shot — the 'hop' idle sub.
  jump: pose('mascot-jump-anim.webp', 1, 'fixed'),
  // 3.4s presenting/gesturing loop — the talking pose under narration.
  pointing: pose('mascot-pointing-anim.webp', 1, 'fixed'),
  // Chroma-keyed hide-and-pop-out cycle (2.5s), authored right-edge-native
  // like the old peek art, so the upstream edge flip serves both edges
  // unchanged. Both peek poses share it.
  peek: pose('mascot-peek-anim.webp', -1, 'edge'),
  peekAlt: pose('mascot-peek-anim.webp', -1, 'edge'),
  // Sitting: sitDown is the 3.6s stand-to-seated transition one-shot played
  // on arrival; sit is the 3.9s seated-idle loop it settles into (the swap is
  // timed in CompanionCharacter via COMPANION_SIT_DOWN_MS).
  sit: pose('mascot-sit-anim.webp', 1, 'fixed'),
  sitDown: pose('mascot-sit-down-anim.webp', 1, 'fixed'),
  // Greeting one-shots (frontal, no baked text — safe unmirrored).
  wave: pose('mascot-wave-anim.webp', 1, 'fixed'), // 2.0s
  highfive: pose('mascot-highfive-anim.webp', -1, 'locomotion'), // 1.8s, palm toward travel
  // 2.5s sparkle-swirl cheer one-shot.
  celebrate: pose('mascot-celebrate-anim.webp', 1, 'fixed'),
};

export type MascotSource = {
  kind: MascotSourceKind;
  src: string;
};

/** Source for a pose — straight from the table (kept as a function so callers
 * don't couple to the table shape, and a future per-pose .webm upgrade stays
 * a one-line kind change). */
export function resolveMascotSource(poseKey: PoseKey): MascotSource {
  const { kind, src } = POSES[poseKey];
  return { kind, src };
}

// Preload img-kind sources so pose swaps never flicker — in two tiers,
// because the animated WebPs total ~9MB and warming them all at mount would
// compete with the page's own first paint (worst on mobile data):
//   Tier 1 (immediately): the sources the mascot is guaranteed to need in its
//     first seconds — the idle loop and both gait cycles.
//   Tier 2 (browser idle time, ~2.5s fallback): every other pose. Skipped
//     entirely when the visitor asked to save data — those sources then
//     simply load on first use, under the 150ms crossfade.
// video-kind sources are always skipped: they can't warm through Image(),
// and <video> streams on first mount.
const TIER_1_POSES: ReadonlySet<PoseKey> = new Set<PoseKey>(['idle', 'walk', 'run']);
let sourcesWarmedUp = false;
export function warmUpMascotSources(): void {
  if (sourcesWarmedUp || typeof window === 'undefined') return;
  sourcesWarmedUp = true;
  const warm = (src: string) => {
    const img = new Image();
    img.src = src;
  };
  const deferred = new Set<string>();
  (Object.keys(POSES) as PoseKey[]).forEach((poseKey) => {
    const def = POSES[poseKey];
    if (def.kind !== 'img') return;
    if (TIER_1_POSES.has(poseKey)) {
      warm(def.src);
    } else {
      deferred.add(def.src); // Set: peek/peekAlt share a file — warm once
    }
  });
  type ConnectionInfo = { saveData?: boolean };
  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  if (connection?.saveData) return;
  const runDeferred = () => deferred.forEach(warm);
  // typeof guard: typed in lib.dom but absent at runtime in Safari.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(runDeferred, { timeout: 2500 });
  } else {
    window.setTimeout(runDeferred, 2500);
  }
}

type MascotMediaProps = {
  def: PoseDef;
  source: MascotSource;
  /** Live FSM facing (-1/1) — consumed only by 'locomotion' poses. */
  facing: MotionValue<number>;
  /** Pre-resolved static flip for 'edge'/'fixed' poses. */
  staticScaleX: number;
};

/** One mounted media element. Its own component so the facing useTransform
 * hook is created per mounted element (elements remount per pose via
 * AnimatePresence). img and video share identical crossfade props — a state
 * upgraded to video later swaps exactly like every WebP state does today. */
const MascotMedia: React.FC<MascotMediaProps> = ({ def, source, facing, staticScaleX }) => {
  // Final on-screen direction = FSM facing × the art's native facing.
  const liveScaleX = useTransform(facing, (f) => (f < 0 ? -1 : 1) * def.nativeFacing);
  const scaleX = def.facingMode === 'locomotion' ? liveScaleX : staticScaleX;

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { opacity: { duration: COMPANION_POSE_CROSSFADE_S, ease: 'linear' as const } },
  };

  if (source.kind === 'video') {
    return (
      <m.video
        className="companion__pose"
        src={source.src}
        autoPlay
        loop
        muted
        playsInline
        style={{ x: '-50%', scaleX }}
        {...fade}
      />
    );
  }
  return (
    <m.img
      className="companion__pose"
      src={source.src}
      alt=""
      draggable={false}
      style={{ x: '-50%', scaleX }}
      {...fade}
    />
  );
};

export type AnimatedMascotPlayerProps = {
  poseKey: PoseKey;
  facing: MotionValue<number>;
  staticScaleX: number;
};

/** The crossfading player: resolves the pose's source and swaps keyed media
 * elements through AnimatePresence (~150ms opacity) so no state change ever
 * hard-pops. */
const AnimatedMascotPlayer: React.FC<AnimatedMascotPlayerProps> = ({ poseKey, facing, staticScaleX }) => {
  const def = POSES[poseKey];
  const source = resolveMascotSource(poseKey);
  return (
    <AnimatePresence initial={false}>
      <MascotMedia key={poseKey} def={def} source={source} facing={facing} staticScaleX={staticScaleX} />
    </AnimatePresence>
  );
};

export default AnimatedMascotPlayer;
