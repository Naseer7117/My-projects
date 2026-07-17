/*
 * constants.ts — tuning values for the interactive effects.
 *
 * Previously these were "magic numbers" scattered through the interactions hook
 * (0.2, 130, 26000, 16000, …). Naming them here makes the behaviour tunable and
 * self-documenting without hunting through the animation loop.
 */

// --- Scroll reveal ---------------------------------------------------------
export const REVEAL_STAGGER_STEP_MS = 70; // delay added per sibling
export const REVEAL_STAGGER_MAX_STEPS = 8; // cap so long lists don't lag
export const REVEAL_THRESHOLD = 0.12; // % of element visible before revealing
export const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px';

// --- Count-up --------------------------------------------------------------
export const COUNT_DURATION_MS = 1600;

// --- Tilt / magnetic -------------------------------------------------------
export const DEFAULT_TILT_DEG = 6;
export const DEFAULT_MAGNETIC_STRENGTH = 0.4;

// --- Cursor ----------------------------------------------------------------
export const CURSOR_RING_LERP = 0.2; // how quickly the ring catches the dot
export const CURSOR_LINK_DIST = 180; // px within which particles link to cursor
export const CURSOR_LINK_ALPHA = 0.6;
export const CURSOR_PULL_DIST_SQ = 26000; // squared px radius of cursor attraction
export const CURSOR_PULL_FORCE = 0.6;
export const CURSOR_PULL_FACTOR = 0.02;

// Selector for elements that should activate the enlarged cursor ring.
export const CURSOR_INTERACTIVE_SELECTOR =
  'a, button, .btn, [data-tilt], .quick-link, input, textarea, [role="button"]';

// --- Navbar ----------------------------------------------------------------
export const NAVBAR_SCROLL_THRESHOLD = 12; // px scrolled before the navbar "sticks"

// --- Particle constellation ------------------------------------------------
export const PARTICLE_MAX = 120;
export const PARTICLE_AREA_DIVISOR = 16000; // one particle per N px² (capped by MAX)
export const PARTICLE_SPEED = 0.35;
export const PARTICLE_MAX_SPEED = 0.9;
export const PARTICLE_RADIUS_MIN = 0.6;
export const PARTICLE_RADIUS_JITTER = 1.6;
export const PARTICLE_LINK_DIST = 130; // px within which two particles link
export const PARTICLE_LINK_ALPHA = 0.5;
export const PARTICLE_FILL = 'rgba(150, 170, 255, 0.55)';
export const PARTICLE_LINK_RGB = '120, 150, 255';
export const CURSOR_LINK_RGB = '34, 211, 238';

// --- Roaming companion character --------------------------------------------
export const COMPANION_BEHAVIOR_MIN_MS = 4000; // shortest a non-walk behavior holds (was 3500 — unhurried pacing pass)
export const COMPANION_BEHAVIOR_MAX_MS = 8000; // longest a non-walk behavior holds

// Position-spring feel. Softened (was 120/14/0.8) in the pacing overhaul:
// the mascot was crossing the screen too fast for its walk cycle to read.
// A lazier spring = slower, calmer travel; arrival detection is measurement-
// based so it simply fires a beat later — never breaks.
export const COMPANION_SPRING_STIFFNESS = 70;
export const COMPANION_SPRING_DAMPING = 17;
export const COMPANION_SPRING_MASS = 0.9;

// Minimum arrival-action holds, keyed by WalkArrivalAction. The FSM clamps
// every requested hold to at least these so no clip is ever cut mid-action
// ("actions complete naturally" — owner spec). Sized to each pose's clip:
// sitting = 3.6s sitDown transition + ≥2s of the seated loop; peeking = the
// 3s exposure the peek sequence spec asks for; waving/highFive cover their
// 2.0/1.8s one-shots with a settle beat; hopping covers the 1.9s jump.
export const COMPANION_ARRIVAL_MIN_HOLD_MS: Record<string, number> = {
  sitting: 5800,
  sittingCross: 4200,
  peeking: 3000,
  waving: 2500,
  highFive: 2500,
  hopping: 2400,
};

// Tier A ("which named in-place behavior to enter next while idle") no
// longer exists as a real weighted choice — sitting/sittingCross/peeking are
// reachable ONLY as a walk's arrival action now (see requestWalk in
// useCompanionBehavior.ts), never a random idle pick, so idle is the sole
// default-layer state and there is nothing left to weight-pick between.

// Tier B — which idle SUB-animation plays while behavior === 'idle' itself
// (see spec §2). Picked uniformly, excluding whichever played last time.
// Subs with a video-derived animation of their own (stretch, doze, dance,
// exercise, think, laugh) swap the mascot to that clip for the hold —
// poseForBehavior in CompanionCharacter.tsx owns that routing. The rest show
// the base idle loop (which already breathes and blinks).
export const COMPANION_IDLE_SUBS = [
  'blinking',
  'lookAroundLeft',
  'lookAroundRight',
  'weightShift',
  'rock',
  'smilePulse',
  'stretch',
  'yawn',
  'footTap',
  'doze',
  'dance',
  'exercise',
  'think',
  'laugh',
  'hop',
] as const;

// --- Cursor interaction state machine (see useCompanionCursorEncounter.ts) --
// Trimmed to notice -> (walk-over via the real FSM) -> single acknowledge ->
// idle. Flee/hide/chase escalation is cut entirely.
export const COMPANION_NOTICE_RADIUS = 180; // px — start "noticing" a lingering cursor
export const COMPANION_NOTICE_DEBOUNCE_MS = 300; // sustained proximity before noticing
export const COMPANION_APPROACH_DELAY_MS = 400; // still-nearby-after this -> approach
export const COMPANION_APPROACH_OFFSET = 60; // px offset from the live cursor point
export const COMPANION_ACKNOWLEDGE_MS = 2100; // how long the single greet hold lasts before returning to idle.
// 2100 (was 1200): the video-derived wave (2.0s) and high-five (1.8s) one-shots
// must finish before the hold ends, or the crossfade cuts them mid-gesture.
export const COMPANION_HIGHFIVE_RADIUS = 90; // px — pointer this close at greet time upgrades the wave to a high-five

// --- Walk FSM timings (see useCompanionBehavior.ts) -------------------------
// Anticipation and Recovery are real, held states (their own duration at a
// fixed pose) bracketing the distance-synced Walking state — not instant
// snaps. Arrival is DETECTED (distance-to-target AND velocity both below
// threshold for 2 consecutive frames), never assumed from a wall-clock timer.
export const COMPANION_ANTICIPATION_MS = 220; // crouch/wind-up hold before the first step
export const COMPANION_RECOVERY_MS = 260; // settle hold after arrival, before the next state
export const COMPANION_ARRIVAL_DISTANCE_PX = 6; // px — spring position within this of target counts as "there"
export const COMPANION_ARRIVAL_VELOCITY_PX_S = 30; // px/s — spring speed must also be under this to count as settled
export const COMPANION_STRIDE_LENGTH_PX = 46; // px of travel per full stride cycle (0->1 phase wrap).
// NOTE: with every gait now a baked video clip, the stride phase no longer
// drives a procedural bob (CompanionCharacter stopped consuming it) — the FSM
// still measures it, and it remains the hook if a distance-synced effect ever
// returns (e.g. footstep dust).

// Steep walks play the climb clip instead of walk/run: when the planned
// vertical travel is big AND dominates the horizontal, wheels-on-a-wall
// reads better than a flat gait dragged diagonally.
export const COMPANION_CLIMB_MIN_VERTICAL_PX = 220; // px — vertical travel below this never climbs
export const COMPANION_CLIMB_VERTICAL_RATIO = 1.5; // vertical must exceed horizontal × this

// Sitting is two poses: the stand-to-seated transition one-shot (sitDown,
// 3.6s), then the seated-idle loop. This is when the renderer swaps them —
// just before the transition clip's freeze frame, so the crossfade overlaps
// its settle. COMPANION_ARRIVAL_MIN_HOLD_MS.sitting guarantees every sitting
// hold outlives this plus a stretch of the loop.
export const COMPANION_SIT_DOWN_MS = 3400; // ms

// --- True edge peeking (see the peek mission in useCompanionBehavior) -------
// The mascot slides most of its container OFF-SCREEN and lets the peek clip's
// lean-out do the reveal — a genuine "behind the viewport edge" read.
export const COMPANION_PEEK_EXPOSURE = 0.35; // fraction of the container left on-screen while peeking
export const COMPANION_PEEK_DUCK_NOTICE_PX = 220; // px — cursor this close (or any scroll) makes the peek duck away
export const COMPANION_PEEK_RELOCATE_SETTLE_MS = 350; // ms fully hidden before the invisible relocate

// --- DOM perch missions (see lib/companionPerch.ts) -------------------------
// Occasionally, instead of a random gutter stroll, the mascot walks onto a
// real page element (hero portrait border, section heading, card top),
// traverses its top edge, hops, and hops back down to a legal roam point.
export const COMPANION_PERCH_CHANCE = 0.35; // probability an idle reschedule becomes a perch mission (when a target is visible)
export const COMPANION_PERCH_TRAVERSE_MIN_PX = 120; // px — skip targets whose walkable top edge is narrower than this

// --- Idle-pool walk trigger (see useCompanionBehavior.ts default scheduler) --
export const COMPANION_IDLE_HOLD_MIN_MS = 3500; // shortest idle hold before the next walk-somewhere
export const COMPANION_IDLE_HOLD_MAX_MS = 7000; // longest idle hold before the next walk-somewhere

// --- Mascot renderer (see CompanionCharacter.tsx / AnimatedMascotPlayer.tsx) --
// The mascot is one media element (animated WebP, static PNG, or — schema-
// ready — transparent <video>) resolved per behavior from a static source
// map; all life/physics is conveyed at the container level (breathing +
// idle drift, squash, stride bob, walk arc, tilt).
export const COMPANION_POSE_CROSSFADE_S = 0.2; // s — opacity crossfade between pose sources (200ms per the motion-engine spec; was 150ms)
export const COMPANION_BREATHE_PERIOD_S = 3.5; // s — idle breathing loop duration
export const COMPANION_BREATHE_LIFT_PX = 8; // px — idle breathing rise (y: [0, -8, 0])
export const COMPANION_DRIFT_PERIOD_S = 7; // s — stationary-idle horizontal drift loop (weightless float)
export const COMPANION_DRIFT_PX = 2; // px — idle drift amplitude (x: [0, 2, 0, -2, 0]) — tiny on purpose:
//                                      it must never visually contradict the safe-zone standing point
export const COMPANION_STRIDE_BOB_PX = 4; // px — walk bounce amplitude, driven by real distance (stride phase)
export const COMPANION_STRIDE_ROCK_DEG = 2; // deg — walk rocking amplitude, one sway per stride cycle
// Walk arc: a purely VISUAL parabolic hop layered over the whole crossing
// (offset = -A·sin(π·progress) on the bob wrapper) so long walks read as
// bounding arcs, not flat slides. Never touches the x/y position springs.
export const COMPANION_ARC_HEIGHT_PER_PX = 0.04; // arc amplitude gained per planned-travel px (400px walk ≈ 16px apex)
export const COMPANION_ARC_MIN_PX = 6; // px — arc apex floor (short hops still lift a little)
export const COMPANION_ARC_MAX_PX = 18; // px — arc apex ceiling (long crossings never balloon)
export const COMPANION_ARC_LEAN_DEG = 3; // deg — lean INTO the travel direction at mid-arc (airborne read)
export const COMPANION_RUN_DISTANCE_VIEWPORT_FRACTION = 0.55; // walks longer than this fraction of the viewport width use the run pose
export const COMPANION_CELEBRATE_MS = 2600; // one-shot celebration hold before returning to idle.
// 2600 (was 1400): the video-derived celebrate one-shot runs 2.5s — the hold
// must outlive it so the sparkle finale isn't crossfaded away mid-cheer.
export const COMPANION_TILT_RADIUS_PX = 160; // px — pointer within this makes the mascot "look toward" the cursor
export const COMPANION_TILT_MAX_ROTATE_Y_DEG = 14; // deg — max pseudo-3D turn toward the cursor (horizontal)
export const COMPANION_TILT_MAX_ROTATE_X_DEG = 8; // deg — max pseudo-3D pitch toward the cursor (vertical)
