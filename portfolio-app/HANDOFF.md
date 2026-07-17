# HANDOFF — portfolio-app continuation briefing

> **Read this first.** This file exists so ANY coding agent (Claude Code, or another
> tool) can pick up this project cold and continue exactly where the last session
> stopped — no chat history needed. It records what's built, the decisions behind
> it, the invariants you must not break, and the exact work queue.
>
> **Protocol: at the end of every working session, UPDATE this file** — refresh
> "Current state", append to the "Session log", and keep the work queue honest.
> That update is what makes the next session seamless. Keep it committed.

---

## 1. Project snapshot

- **What**: Personal portfolio site for **Naseeruddin Shaik** (Software Engineer —
  Java/Spring Boot backend, moving into data science). All real career facts and
  copy live in ONE typed file: `src/content/portfolio.ts` (exports `portfolioData`
  and `navItems`; note its banner comment says "portfolioData.ts" — stale name,
  the real file is `portfolio.ts`).
- **Stack**: React 19.2 + TypeScript 4.9.5 + Create React App (react-scripts 5.0.1,
  NOT Vite/Next) + framer-motion 12.42.2 + Bootstrap 5.3 CSS. Custom hash router
  (`useHashRoute`) — no router library, so no SPA-redirect config is needed.
- **Layout**: monorepo `My-projects` (GitHub: Naseer7117/My-projects); the site is
  the `portfolio-app/` folder. `netlify.toml` at monorepo root builds/publishes
  ONLY portfolio-app. Owner deploys by pushing (they described the host as Vercel;
  the checked-in config is Netlify — either way: **push = deploy**, so never push
  without the owner's go-ahead).
- **Branches**: day-to-day work and "lock it in" commits happen on `master`;
  `main` is origin's default and the two get merged for deploys. The owner
  handles merging/pushing — never switch or merge branches without asking.
- **Path aliases**: `tsconfig.json` sets `baseUrl: "src"` — bare imports like
  `'content/portfolio'`, `'lib/companionConfig'` resolve under `src/`.
- **Commands** (run in `portfolio-app/`):
  - Dev server: `npm start` (port 3000)
  - Typecheck: `npx tsc --noEmit`
  - Lint: `npx eslint src --ext .ts,.tsx --max-warnings=0`
  - Tests: `npm test -- --watchAll=false` (2 smoke tests; jsdom canvas
    console.errors are normal noise, tests still pass)
  - Build: `npm run build` (run all four before calling anything done)
- **Framer Motion rule**: the app renders inside `<LazyMotion strict>` — always
  use `m.*` components, **never** `motion.*` (strict mode throws).
- **Route registry**: `src/app/routes.tsx`; pages in `src/features/<name>/`;
  composition root `src/app/App.tsx`; almost all styling in `src/app/App.css`.

## 2. Working agreements (how the owner likes to work)

- Ask before destructive/irreversible ops (git stash/reset, deletes); committing
  is done when they say "lock it in"; **they** push (push = live deploy).
- Quality bar: "five polished behaviors over twenty mediocre ones" — depth over
  breadth, always. Don't add features beyond what was asked.
- Verify visually, not just by gates — they check the live site on desktop AND
  their phone. Mobile perf matters (that's why the particle canvas is gated off
  coarse-pointer/touch devices via `hasFinePointer()` in `useCursorFx.ts`, and
  heavy blurs/shadows are cheapened in the ≤767px CSS block).
- The sibling `telegrambot` project is intentionally excluded from this portfolio —
  never feature or mention it in site content.

## 3. Maska Bhai — the mascot (the main ongoing work)

The site companion robot is officially named **"Maska Bhai"**. Design source of
truth is the owner's **NS01 blueprint**: glossy ceramic-white body, matte-black
segmented joints, large dark visor with blue LED eyes, glowing antenna +
ear rings, gold-rimmed "NS" chest badge, navy cape with gold trim, short cute
proportions. Any new art/clips must match it — identity drift is a rejection.

### Architecture (each layer owns exactly one concern)

| Layer | File | Owns |
|---|---|---|
| Sizes/layout constants | `src/lib/companionConfig.ts` | THE single source of truth: desktop **96px**, mobile **64px**, breakpoint 767, `EDGE_INSET` 16, `NAVBAR_CLEARANCE` 84, `CONTENT_MAX_WIDTH` 1280. `applyCompanionSizeCssVar()` syncs `--companion-size` to CSS at app start. |
| Legal standing zones | `src/lib/companionZones.ts` | `randomSafePoint` (side gutters, only when viewport ≥ `minViewportForGutterRoaming()` = **1536px**), `fixedCornerPoint` (mobile bottom-right pocket), `peekEdgePoint(exposure)` (TRUE edge peek — container mostly off-screen), `offscreenHidePoint` (duck-away target), `targetedAnchorPoint` (context beats). Structural guarantee: outside the 1280px content column is empty background on every page. |
| DOM perching | `src/lib/companionPerch.ts` | Finds perchable elements (hero portrait, `.section-title`, `.card`) that are fully in-viewport and wide enough, and measures their top border into mascot coordinates (`measurePerchSpan` re-runs on scroll so the mascot stays glued). Deliberately relaxes gutter-only roaming (owner request) — the mascot stands ABOVE elements, never on their content. |
| The FSM | `src/hooks/interactions/useCompanionBehavior.ts` | idle → anticipation (220ms) → walking → **measured arrival** (dist < 6px AND speed < 30px/s for 2 consecutive frames — NEVER a timer) → recovery (260ms) → arrival action (sit/peek/wave/highFive) or idle. Position = `useSpring` (stiffness 120, damping 14, mass 0.8). Facing from x-velocity with 40px/s deadzone. Distance-synced stride: real px accumulate, 46px per cycle, written to `strideRef` + `--stride-phase`. Priority: talking handoff > everything (snaps, no walk); celebration only fires when parked. |
| Idle variety | `src/hooks/interactions/useCompanionIdlePool.ts` | "Tier-B" idle subs = micro-behaviors WITHIN the idle state (blink, look around, stretch…, `COMPANION_IDLE_SUBS` in constants.ts, 9 entries), picked per idle hold with no immediate repeat. (There is no Tier-A system anymore — big behaviors like sit/peek are reachable only as walk arrival actions.) |
| Per-page beats | `src/hooks/interactions/useCompanionContextBeat.ts` | One walk-to-element beat per route landing: Home→peek at hero portrait (left side, enabled only while narration is NOT playing — the talking handoff outranks it), About→sit at timeline, Skills/Projects→peek at first card, Contact→sit at card. |
| Cursor encounter | `src/hooks/interactions/useCompanionCursorEncounter.ts` | notice (<180px, 300ms) → walk over → wave (or high-five if <90px) → dormant. Fine-pointer devices only. |
| Cross-feature channels | `src/hooks/interactions/CompanionContext.tsx` | talking handoff (HomePage narration), context-beat requests, celebration requests (nonce-gated). |
| Container physics | `src/components/effects/CompanionCharacter.tsx` | Wrapper chain `.companion > __stage (cursor tilt) > __squash (stiffness 200/damping 10, deliberately underdamped) > __bob (stride bob −4px·\|sin(π·phase)\| + rock 2° + hop arc) > __float (breathe/drift) > player`. Feet-anchored `transform-origin: 50% 100%`. |
| Asset layer | `src/components/effects/AnimatedMascotPlayer.tsx` | `POSES` — a single webp-only table (src, `nativeFacing`, `facingMode`, kind 'img'\|'video'); 150ms AnimatePresence crossfade; two-tier preloading (idle+walk+run immediate, rest at browser idle, skipped under Save-Data). **Adding/replacing a state = drop the .webp in `public/assets/mascot/` + its `POSES` line.** |
| CSS | `src/app/App.css` | `.companion` block (~line 1658), mobile overrides (~line 2578), and the mobile footer reservation (~line 663). |

### DO-NOT-BREAK invariants (each was a real bug)

1. **Never teleport/slide ON SCREEN**: position is springs only; no
   `transition: transform` in CSS; arrival is DETECTED from the live spring,
   never assumed from a timer (a fixed walk timer was the original "floating
   sticker" bug). The ONE sanctioned exception: the peek mission's relocate
   uses `.jump()` on the springs — but only after the mascot has settled
   FULLY off-screen (invisible), so no teleport is ever visible.
2. **StrictMode guard placement** (`useCompanionContextBeat.ts`): the
   fired-once guard is set INSIDE the timeout callback, not at schedule time.
   Setting it at schedule time makes beats never fire on the dev server.
3. **Stable idle-pool identity** (`useCompanionIdlePool.ts`): `pickIdleSub` /
   the returned object must keep stable identities (useCallback/useMemo) or the
   arrival rAF loop tears down every render and the mascot strands in `walking`.
4. **Walk-scoped rAF baselines** (`useCompanionBehavior.ts`): `lastX/lastY/
   strideAccum/settledFrames` reset on the first frame of each walk, or every
   walk after the first starts with one giant spurious stride step.
5. **`facing`/`strideRef`/`walkArcRef` stay MotionValue/refs** — syncing them to
   useState would re-render up to 60×/sec.
6. **Mobile footer reservation** (`App.css` `.site-footer` in the ≤767px block):
   `padding-bottom: calc(64px + 64px) !important` — the `!important` is required
   to beat Bootstrap's `.py-4 !important`, and the first term must equal
   `COMPANION_SIZE_MOBILE`. This is what makes the corner pocket *guaranteed*
   text-free.
7. **Size changes**: touch `companionConfig.ts` AND the hand-synced CSS spots
   (fallbacks in `.companion`, mobile `--companion-size`, footer calc). Current
   96px is the ceiling before 1536-wide laptops lose gutter roaming
   (threshold formula: `1280 + (16·2 + size)·2`).
8. **Respect the `POSES` table's facing rules**: frontal/direction-agnostic
   poses (incl. climb) are `facingMode: 'fixed'`; peeks are edge-driven and
   authored right-edge-native; locomotion clips are authored facing RIGHT
   (mirror at conversion if a clip faces left — never flip the table entry).
9. **Reduced motion**: companion is `display: none` under
   `prefers-reduced-motion` and the FSM's `enabled` is false — keep both.

## 4. Animation clip pipeline (the active workstream)

**COMPLETE as of 2026-07-17: the mascot is 100% video-derived.** The static
PNG pose-swapping layer is fully retired — the 12 PNGs are deleted, `POSES`
in AnimatedMascotPlayer.tsx is a single webp-only table (no ANIMATED_SOURCES
override map, no fallbacks), and every pose has a clip: idle + 7 idle
personality subs (stretch/doze/dance/exercise/think/laugh/hop→jump), walk,
run, climb, sit + sitDown, pointing (talking), peek (shared by both edges),
wave, highfive, celebrate. Owner explicitly overrode the earlier rejections
("i want those"): run is in despite being slightly off-model (offer seeded
regeneration as polish), climb got a NEW `climb` gait (steep vertically-
dominated walks — see COMPANION_CLIMB_* constants), sit-down became the
sitting entry transition (sitDown one-shot → sit loop, swapped at
COMPANION_SIT_DOWN_MS=3400ms in CompanionCharacter). The procedural stride
bob/rock is REMOVED (baked gaits own their bounce; only the hop arc remains,
and climb gets no offsets at all). Known cosmetic trade-off: locomotion/peek
clips show a mirrored NS badge in one direction/edge — inherent to
single-orientation art, invisible at 96px.

**How a clip becomes a site animation:**

Clips arrive as `.mp4` files in `C:\Users\honey\Downloads\Telegram Desktop\Mascot frames\`;
the filename names the action/state (`walk.mp4`, `wave.mp4`…) — confirm the
mapping with the owner if ambiguous.

1. Owner generates an AI video clip of Maska Bhai doing the action.
   **Seed every generation with `SEED-use-this-image-for-all-clips.png`**
   (in that same folder) — unseeded generations drift off-model (that's what
   sank idle-look). Ideal: flat green background; in practice clips come on a
   dark studio gradient, which the row-model converters below handle.
   **Locomotion clips (walk/run) must be in-place cycles** — reject/regenerate
   if the character travels across the frame (the tell in the preview strip:
   the character sits at different x positions across the 4 frames).
2. Convert. Interpreter on this machine: **`py -3.12`** (has opencv 5.0/numpy/
   pillow; plain `python` is a dead Store alias and `py -3` = 3.14 without the
   packages). Run from `portfolio-app/`: `py -3.12 scripts\convert_clips.py`.
   Pick the script by clip type — **loops** (walk, run, sit-idle, extra idles)
   → `convert_clips.py`; **one-shots** (wave, high-five, celebrate, jump, peek
   entrance) → `convert_variants.py`:
   - `convert_clips.py` — LOOPING states: row-model background matte (per-row
     side-margin median; fg = dist>38 | sat>130 | lum>150), auto loop-point
     (most-frame-0-like frame 2.5–6.5s in), 3-frame crossfade seam, 12fps,
     360px tall, `loop=0`. Output: `scripts/out/webp-loops/<name>-anim.webp`
     (**no `mascot-` prefix — rename when installing**).
   - `convert_variants.py` — ONE-SHOT actions: same matte but bright-branch
     `lum > 175` (needed for lighter floors), motion-energy windowing (largest
     high-motion run, padded −0.5s/+0.75s), NO crossfade, `loop=1` (plays once,
     freezes on last frame). Output: `scripts/out/webp-oneshots/
     mascot-<name>-anim.webp` (already final naming).
   - `mascot-video-to-webp.py` — CLI chroma-key tool for true green-screen
     clips (unused so far; prefer it if clips ever arrive on green).
   - **Two edits per run**: set `SRCDIR` at the top, AND replace the hardcoded
     clip-basename list in the `for` loop at the bottom (e.g. `["walk"]`) — as
     shipped the lists still name the idle-era clips, and a listed name with no
     matching `.mp4` crashes the script. ALWAYS eyeball the `-preview.png`
     strip (frames over magenta) before installing — matting failures are
     obvious there.
3. Install: copy the good `.webp` to `public/assets/mascot/mascot-<state>-anim.webp`.
4. Wire — one line in `ANIMATED_SOURCES` in `AnimatedMascotPlayer.tsx`
   (`kind: 'img'` covers animated WebP), PLUS three checks that are NOT optional:
   - **Facing**: animated variants render in the SAME orientation as their
     static pose (one `nativeFacing` per pose). If the clip natively faces the
     other way, mirror the frames in the converter (`cv2.flip(frame, 1)`) —
     do NOT edit the shared `POSES` entry, it also governs the static PNG.
     For wave: the static PNG has a baked "Hi!" bubble (why it never mirrors);
     if the animated wave has no bubble, decide its facing rule consciously
     and note the decision here.
   - **Duration vs FSM hold** (one-shots): the clip must finish before the FSM
     crossfades the pose away. Holds were ALREADY RAISED for the installed
     clips: wave/high-five = 2100ms (`COMPANION_ACKNOWLEDGE_MS`, was 1200),
     celebrate = 2600ms (`COMPANION_CELEBRATE_MS`, was 1400); idle subs
     ≥ 3500ms. If a regenerated clip runs longer, raise the hold again.
   - **Locomotion double-bob — SOLVED, keep it working**: `isAnimatedPose()`
     (exported from AnimatedMascotPlayer) gates the procedural stride dip/rock
     off when the active gait's pose has a baked clip; the hop arc + lean stay
     on. If `run` ever gets a clip, this gate covers it automatically — just
     verify visually once.
   New poses (not in `PoseKey`) follow the idleStretch pattern: `POSES` entry,
   `ANIMATED_SOURCES` entry, routing in `poseForBehavior`.
5. Verify (see §6), then run the four gates, then commit.

**Matting lessons already paid for** (don't re-lose them): naive flood fill leaks
through anti-aliased gradients; global thresholds can't split shaded-white body
(125–140 lum) from bright floor (110–125) — the per-row background model is the
fix; center-spotlight backgrounds break even that (idle-look was declared
unusable for this + mid-clip identity drift — regenerate it, seeded).

**Wanted clips** (owner is generating; 15-prompt list was provided to them):
walk cycle, run cycle, wave, peek (left/right), sit-down/sit-idle, celebrate,
jump, climb, pointing/talking, high-five, plus extra idle variants. `jump` and
`climb` PNGs exist but have NO FSM trigger yet — only wire new states if the
owner asks.

## 5. Other shipped features (context)

- **"Play Intro"** (`useIntroNarration.ts` + `IntroCaptions.tsx`, wired ONLY in
  `HomePage.tsx`): browser `speechSynthesis` narration of a script built from
  `portfolioData.hero` fields, word-synced captions via utterance `boundary`
  events (word-count based), play/pause toggle over the hero portrait. While
  playing, the mascot snaps to an anchor above the portrait (talking handoff)
  and the home context beat is suppressed. Cancels on unmount. No-ops where
  speechSynthesis is missing or reduced-motion is on.
- **Intro/page-scan choreography**: full intro once per session
  (`sessionStorage.introSeen`), quick after; scan routes: home/skills/contact.
- **Mobile perf tuning**: particle canvas gated off coarse-pointer devices
  (`hasFinePointer()` in `useCursorFx.ts` — NOT a width check); blur/shadow
  cheapened at ≤767px; companion drop-shadow killed on mobile.
- **Architecture refactor** (earlier): route registry + ErrorBoundary; god-hook
  split into focused hooks; magic numbers live in `src/lib/constants.ts`.

## 6. Verification playbook

Claim nothing without: `npx tsc --noEmit` ✓, eslint ✓, `npm test -- --watchAll=false` ✓,
`npm run build` ✓, and a VISUAL check for anything user-facing.

Visual checks are done via Chrome DevTools Protocol against `npm start`:

- Launch an ISOLATED Chrome manually (no template does this):
  `& "C:\Program Files\Google\Chrome\Application\chrome.exe"
  --remote-debugging-port=9333 --user-data-dir=<scratch profile dir>
  --no-first-run` — **NEVER attach to port 9222** (that's the owner's real
  browser).
- Templates live in `scripts/verify/` (Node scripts, no deps; run
  `node scripts/verify/<name>.js` with env `OUT=<dir for screenshots>`): create
  a tab via `PUT /json/new`, drive it over the DevTools WebSocket.
  `verify-size-bump.js` / `verify-animated-idle.js` are the current pattern;
  `verify-safe-zones.js` is older (fixed sleeps — prefer polling).
- Triggering states deterministically: **walk** — viewport ≥1536px wide, then
  wait out one idle hold (3.5–7s), or navigate routes for a context beat;
  **wave/high-five** — synthesize `Input.dispatchMouseEvent` mouseMoved to
  within 180px of the live `.companion` rect, hold ≥300ms (within 90px at greet
  time upgrades to high-five); **stretch** — poll the `<img>` src while idle
  (~1/8 chance per idle hold).
- Hard-won rules baked into those templates:
  - `Runtime.evaluate` with `awaitPromise: true` for anything async;
  - re-measure `getBoundingClientRect` immediately before EVERY screenshot of a
    moving element (the mascot moves — stale rects give empty crops);
  - poll for states (pose src, scroll settled), never fixed sleeps;
  - mobile safe-zone test = emulate 390×844, scroll to absolute bottom, assert
    zero bounding-box overlap between `.companion` and any text-bearing element
    (`verify-size-bump.js` shows the full pattern);
  - the mascot's rect can read 95.99…×96 mid-breath (transforms) — compare with
    tolerance, not strict equality.

## 7. Work queue (next session starts here)

1. **Optional regenerations** (seed with the SEED image!):
   - `idle-look` — still open (old clip: spotlight background + identity
     drift). Wiring is ready: `lookAroundLeft`/`lookAroundRight` subs exist;
     follow the idleStretch pattern.
   - `run` — SHIPPED but the clip is slightly off-model (flatter visor than
     the seed). Works at 96px; regenerate only if the owner wants it perfect.
     Replacing = convert mirrored (`flip=True`), overwrite
     `mascot-run-anim.webp`, done — no code change.
2. **Total animation weight is ~7.8MB** across 15 WebPs. warmUpMascotSources
   is TIERED now (statics + idle + walk immediately; the rest at browser idle,
   skipped under Save-Data). If mobile perf complains, next lever: re-encode
   the heaviest loops (idle 924KB, think 907KB, dance 881KB, doze 827KB) at
   q70/10fps.
3. **Idle personality frequency**: 6 of 14 idle subs now play a big animated
   move (~43% of idle holds). If the owner finds Maska Bhai too hyperactive,
   rebalance by duplicating calm subs in `COMPANION_IDLE_SUBS` or splitting
   the pool into weighted tiers.
4. Standing: keep this file updated at the end of every session.

## 8. Session log

- **2026-07-17** — Locked commit `7c7629b`: full Maska Bhai system (FSM, player,
  zones, config, 14 assets), Play Intro narration, mobile perf fixes, size bump
  to 96/64px. Named the mascot "Maska Bhai". All gates green; desktop + mobile
  visually verified via CDP (zero text overlap at settled bottom scroll on home
  and skills). Working tree clean; NOT pushed (owner pushes). Rescued the
  conversion scripts into `scripts/`, CDP templates into `scripts/verify/`,
  wrote this handoff file.
- **2026-07-17 (later)** — THE BIG CLIP BATCH: owner delivered 17 clips; 13
  accepted and installed (walk, sit, talk→pointing, peek chroma-keyed +
  mirrored, wave, high-five, celebrate, jump, and five new idle personality
  subs: doze/dance/exercise/think/laugh). Rejected: run (off-model robot),
  climb (unclear motion), sit-down (redundant vs sit-idle). New pipeline
  lessons now baked into the rework scripts: size-limited hole-fill for
  sparkle-heavy clips (full flood-fill painted background blocks), row-model
  beats temporal-median when the body is static, window past camera-zoom
  intros, mirror at read time (`cv2.flip`). Code: 5 new PoseKeys,
  isAnimatedPose() double-bob gate, tiered preloading (~7.8MB assets),
  ACKNOWLEDGE_MS 1200→2100, CELEBRATE_MS 1400→2600, idle subs 9→14. All gates
  green; CDP-verified live: walk/sit/peek/talk/wave/think/doze/stretch/laugh
  all seen animating on the dev server. NOT pushed.
- **2026-07-17 (final)** — FULLY ANIMATED, PNG layer retired (owner: "remove
  the previous reference of the cutted png images"). Reinstated the three
  rejected clips on owner override: run (mirrored; slightly off-model,
  regeneration optional), climb (new steep-walk `climb` gait: |dy|>220 AND
  |dy|>1.5|dx|), sit-down (sitting = sitDown transition one-shot → sit loop
  at 3400ms). jump wired as the 'hop' idle sub (subs now 15). POSES is a
  single webp-only table; 12 static PNGs deleted; procedural stride bob/rock
  removed (baked gaits); hop arc kept except for climb. 18 files / 8.8MB in
  assets/mascot. All gates green; CDP-verified: sitDown→sit swap, run, climb,
  hop all seen live; zero .png requests. NOT pushed.
- **2026-07-17 (motion engine)** — Motion & asset engine overhaul (owner spec):
  (1) PACING — springs softened 120/14/0.8 → 70/17/0.9 (constants), crossfade
  150→200ms, idle holds 4-8s, per-arrival minimum holds
  (COMPANION_ARRIVAL_MIN_HOLD_MS) clamp every hold so no clip cuts mid-action,
  recovery now keeps the gait pose (killed a 260ms idle flash between walk
  and arrival). (2) MISSIONS — a step queue rides the normal walk FSM
  (missionRef in useCompanionBehavior; external requestWalk callers cancel
  it; talking cancels it). Perch mission (~35% of idle reschedules when a
  target is visible): approach → traverse a real element's TOP BORDER
  (hero portrait / .section-title / .card, via lib/companionPerch.ts, rect
  re-measured on scroll) → 'hopping' behavior (jump clip) at the far end →
  descend to a legal roam point. Peek mission (~18%): walk to
  peekEdgePoint(0.35 exposure) mostly OFF-SCREEN → hold ≥3s → duck fully
  off-screen (early if cursor <220px or any scroll) → invisible spring
  .jump() relocate → re-emerges elsewhere. All gates green; CDP-verified
  live on #skills: perch traverse ON a card border, edge hop, true edge peek
  at x=-62, hidden relocate (-104→319). NOT pushed.
