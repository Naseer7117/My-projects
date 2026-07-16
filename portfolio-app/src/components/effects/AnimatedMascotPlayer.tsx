import React from 'react';
import { AnimatePresence, m, MotionValue, useTransform } from 'framer-motion';
import { COMPANION_POSE_CROSSFADE_S } from 'lib/constants';

/*
 * AnimatedMascotPlayer — the mascot's ASSET layer.
 *
 * Given a pose key, resolves the best available source from a STATIC map
 * (no runtime HEAD probes — availability is decided in code, at build time)
 * with graceful degradation:
 *
 *   animated WebP (mascot-<state>-anim.webp)  — if one is checked in
 *     -> static PNG (mascot-<state>.png)      — always exists, the fallback
 *
 * and renders it as one crossfading media element. Two source KINDS exist:
 *
 *   'img'    <img>  — static PNGs and animated WebPs alike (an animated WebP
 *                     loops natively as a plain <img> src, alpha included)
 *   'video'  <video autoPlay loop muted playsInline> — for future
 *                     transparent .webm renders. No .webm is checked in yet;
 *                     the schema + render path exist NOW so upgrading a state
 *                     later is one ANIMATED_SOURCES line, zero code.
 *
 * Crossfade: pose swaps mount a new keyed element through AnimatePresence
 * with a ~150ms linear opacity fade (COMPANION_POSE_CROSSFADE_S) — img and
 * video sources fade through the exact same variant props, so a future
 * video state swaps indistinguishably from a PNG one.
 *
 * Facing lives HERE (per media element) because it's an asset property:
 * final on-screen scaleX = desired facing × the art's own native facing.
 * Container physics (position springs, squash, bob/arc, tilt, breathing)
 * stay in CompanionCharacter.tsx — this component never moves the mascot.
 */

export type PoseKey =
  | 'idle'
  | 'idleStretch'
  | 'walk'
  | 'run'
  | 'jump'
  | 'climb'
  | 'pointing'
  | 'peek'
  | 'peekAlt'
  | 'sit'
  | 'wave'
  | 'highfive'
  | 'celebrate';

/** How a pose's on-screen direction is decided:
 *  - 'locomotion': follow the FSM's velocity-derived facing (walk/run/greet)
 *  - 'edge':       decided by which screen edge is being peeked from
 *  - 'fixed':      never mirrored (frontal art, or art with baked-in text
 *                  like the wave's "Hi!" bubble, which would read backwards) */
export type FacingMode = 'locomotion' | 'edge' | 'fixed';

export type PoseDef = {
  /** The always-available static PNG for this pose. */
  src: string;
  /** Direction the ART faces as drawn: 1 = right, -1 = left. Final on-screen
   * scaleX = desiredFacing × nativeFacing, so a left-drawn pose shown while
   * moving left needs NO flip, and so on. Animated variants are rendered in
   * the SAME orientation as their static pose, so one table serves both. */
  nativeFacing: 1 | -1;
  facingMode: FacingMode;
};

const MASCOT_BASE = `${process.env.PUBLIC_URL || ''}/assets/mascot`;

/** NATIVE_FACING table — read off the actual renders (see each note). */
export const POSES: Record<PoseKey, PoseDef> = {
  // Frontal, presenting finger raised — no inherent direction.
  idle: { src: `${MASCOT_BASE}/mascot-idle.png`, nativeFacing: 1, facingMode: 'fixed' },
  // One-shot stretch idle variant (video-derived). Static fallback is the
  // plain idle PNG — without the animated file this pose is indistinguishable
  // from idle, which is exactly the right degradation.
  idleStretch: { src: `${MASCOT_BASE}/mascot-idle.png`, nativeFacing: 1, facingMode: 'fixed' },
  // 3/4 stride: head turned to the viewer's RIGHT, cape trailing left.
  walk: { src: `${MASCOT_BASE}/mascot-walk.png`, nativeFacing: 1, facingMode: 'locomotion' },
  // Superhero dash pointing RIGHT (fist forward right, legs trailing left).
  run: { src: `${MASCOT_BASE}/mascot-run.png`, nativeFacing: 1, facingMode: 'locomotion' },
  // Frontal float — no inherent direction. (No FSM trigger yet; preloaded only.)
  jump: { src: `${MASCOT_BASE}/mascot-jump.png`, nativeFacing: 1, facingMode: 'fixed' },
  // Profile reaching up toward a wall on its RIGHT. (No FSM trigger yet.)
  climb: { src: `${MASCOT_BASE}/mascot-climb.png`, nativeFacing: 1, facingMode: 'locomotion' },
  // Frontal presenting gesture (talking) — mirroring adds nothing.
  pointing: { src: `${MASCOT_BASE}/mascot-pointing.png`, nativeFacing: 1, facingMode: 'fixed' },
  // Leans out to the LEFT of a wall edge drawn on its right — native for a
  // RIGHT-edge peek; flipped when peeking from the left edge.
  peek: { src: `${MASCOT_BASE}/mascot-peek.png`, nativeFacing: -1, facingMode: 'edge' },
  // Same orientation as peek (leans left, edge on the right) — used unflipped
  // at the right edge for variety.
  peekAlt: { src: `${MASCOT_BASE}/mascot-peek-alt.png`, nativeFacing: -1, facingMode: 'edge' },
  // Frontal thinking/settled pose — no inherent direction.
  sit: { src: `${MASCOT_BASE}/mascot-sit.png`, nativeFacing: 1, facingMode: 'fixed' },
  // Waves with a baked-in "Hi!" speech bubble — NEVER mirrored (the text
  // would read backwards), so facingMode is fixed despite the left lean.
  wave: { src: `${MASCOT_BASE}/mascot-wave.png`, nativeFacing: -1, facingMode: 'fixed' },
  // Open palm raised on the art's LEFT — follows facing so the palm ends up
  // toward the cursor it walked to.
  highfive: { src: `${MASCOT_BASE}/mascot-highfive.png`, nativeFacing: -1, facingMode: 'locomotion' },
  // Mid-air cheer with a sparkle swirl — frontal, no inherent direction.
  celebrate: { src: `${MASCOT_BASE}/mascot-celebrate.png`, nativeFacing: 1, facingMode: 'fixed' },
};

export type MascotSourceKind = 'img' | 'video';

export type MascotSource = {
  kind: MascotSourceKind;
  src: string;
};

/** Fluid-animation upgrades, per pose. An entry here WINS over the static
 * PNG in POSES. Add a line when the file lands in public/assets/mascot/ —
 * that is the entire upgrade path for a state:
 *
 *   walk: { kind: 'img',   src: `${MASCOT_BASE}/mascot-walk-anim.webp` },
 *   wave: { kind: 'video', src: `${MASCOT_BASE}/mascot-wave.webm` },
 *
 * ('img' also covers ANIMATED WebP — browsers loop it natively as an <img>
 * src. 'video' is for transparent .webm, rendered muted/looping/inline.
 * The chroma-key converter for AI-generated green-screen clips lives at
 * scripts/mascot-video-to-webp.py.) */
const ANIMATED_SOURCES: Partial<Record<PoseKey, MascotSource>> = {
  // Video-derived 6.5s breathing + blink loop (78 frames, alpha), loops natively.
  idle: { kind: 'img', src: `${MASCOT_BASE}/mascot-idle-anim.webp` },
  // Video-derived 2.2s stretch, encoded loop=1 (plays ONCE then freezes on a
  // near-neutral final frame) — the FSM's idle hold outlives it, then the
  // next behavior crossfades away. Reached only while idleSub === 'stretch'.
  idleStretch: { kind: 'img', src: `${MASCOT_BASE}/mascot-idle-stretch-anim.webp` },
};

/** Best available source for a pose: animated entry if checked in, else the
 * static PNG. Static map — never probes the network. */
export function resolveMascotSource(pose: PoseKey): MascotSource {
  return ANIMATED_SOURCES[pose] ?? { kind: 'img', src: POSES[pose].src };
}

// Preload every img-kind source once (static PNGs + animated WebPs) so the
// first swap to any pose never flickers. video-kind sources are skipped:
// they can't warm through Image(), and <video> streams on first mount —
// the 150ms crossfade covers its first-frame latency.
let sourcesWarmedUp = false;
export function warmUpMascotSources(): void {
  if (sourcesWarmedUp || typeof window === 'undefined') return;
  sourcesWarmedUp = true;
  (Object.keys(POSES) as PoseKey[]).forEach((pose) => {
    const { kind, src } = resolveMascotSource(pose);
    if (kind !== 'img') return;
    const img = new Image();
    img.src = src;
  });
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
 * upgraded to video later swaps exactly like every PNG state does today. */
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

/** The crossfading player: resolves the pose's best source and swaps keyed
 * media elements through AnimatePresence (~150ms opacity) so no state
 * change ever hard-pops. */
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
