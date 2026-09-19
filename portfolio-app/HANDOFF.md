# HANDOFF — portfolio-app continuation briefing

> **Read this first.** This file exists so ANY coding agent (Claude Code, or another
> tool) can pick up this project cold and continue exactly where the last session
> stopped — no chat history needed. It records what's built, the decisions behind
> it, the invariants you must not break, and the exact work queue.
>
> **Protocol: at the end of every working session, UPDATE this file** — refresh
> "Current state", append to the "Session log", and keep the work queue honest.
> That update is what makes the next session seamless.
>
> **Also keep `README.md` current** (the human-facing overview) whenever
> structure or features change — it points here for depth, don't duplicate.
> **Use the ponytail skill for new implementation** (laziest thing that works).
> **Do NOT git commit** — the owner commits manually with their own messages;
> leave the working tree ready and verified.

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
| Sizes/layout constants | `src/lib/companionConfig.ts` | THE single source of truth: desktop **132px** (default/full), mobile **104px**, `COMPANION_SIZE_FIT_FLOOR` **88px** (perch shrink floor), breakpoint 767, `EDGE_INSET` 16, `NAVBAR_CLEARANCE` 84, `CONTENT_MAX_WIDTH` 1280. `applyCompanionSizeCssVar()` syncs the RESTING `--companion-size`. |
| Legal standing zones | `src/lib/companionZones.ts` | `randomSafePoint` (side gutters, only when viewport ≥ `minViewportForGutterRoaming()` = **1872px** at 132px), `fixedCornerPoint`, **`variedRestPoint`** (no-gutter desktop rest picks a varied x along the bottom band so he actually roams, not corner-pinned), **`bottomStandY(vh,size)`** (= `vh − size + FOOT_OFFSET`, so bottom rests put his VISIBLE feet ON the viewport bottom edge, not floating above), `peekEdgePoint(exposure)`, `offscreenHidePoint`, `targetedAnchorPoint`. **Content is near-full-width — `.page-shell` `padding-inline: clamp(1rem,2vw,1.5rem)` + `.container`/`.container-xxl` `max-width: min(100%, 1760px)`, navbar matches; side margins ~36px (was ~120px). Old empty side gutters are gone — he roams by PERCHING.** Perch/peek are NOT gutter-gated; only plain-roam falls back to gutter (≥1872px) or bottom-band/corner. |
| DOM perching (primary roam) | `src/lib/companionPerch.ts` | `PERCH_SELECTORS` = `.hero-portrait-wrapper`, `.hero-title` (the big "Hi, I am…" H1), `.section-title`, `.card`. `fitSizeFor(el)` returns the largest size in [88, 132] that fits an element's top border, or null only if even 88 fails — a tight card SHRINKS him instead of being skipped (movement never stops). `findPerchTarget` returns `{el,start,end,size}`; `measurePerchSpan(el, vw, size, vh)` uses `size` for the x-span, FULL size for y. **Text headings (`isTextTarget`: H1/H2/H3/.hero-title/.section-title) get a `TEXT_ASCENT_LIFT_PX` (17) lift** so feet land on the visible letters, not the box top (glyphs overflow ~17px above the box). Stands ABOVE elements, never on content. |
| Perch fit-scale | `CompanionCharacter` `.companion__scale` + `perchScaleRef` | The shrink is a **bottom-origin CSS `scale` on `.companion__scale`** (transform-origin 50% 100%), eased per-frame toward `perchScaleRef.current` (= `fitSize/132`, set on the perch mission's surface legs). Bottom-origin = **feet stay planted** while he resizes; the container box never changes (resizing a `position:fixed` box drops the feet). **Reset to 1 in `clearMission` AND in `enterIdle` when the mission drains** — so a shrunk scale can NEVER leak into a standing/idle/peek pose (that leak was a real bug). |
| The FSM | `src/hooks/interactions/useCompanionBehavior.ts` | idle → anticipation (220ms) → walking → **measured arrival** (dist < 6px AND speed < 30px/s for 2 consecutive frames — NEVER a timer) → recovery (260ms) → arrival action (sit/peek/wave/highFive/hopping) or idle. Position = `useSpring` (**stiffness 70, damping 17, mass 0.9** — softened for calmer travel). Facing from x-velocity, 40px/s deadzone. **MISSIONS** (perch, peek) are step queues that ride the walk FSM (`missionRef`; `consumeMissionStep`; external callers cancel via `clearMission`). A **stepped traverse** walks a wide element in `COMPANION_TRAVERSE_STEP_PX` (170) segments with a `pauseMs` (550) hold before each (`walk-stop-walk`, not one dart). **Idle scheduler**: nap (doze) if no input > `COMPANION_NAP_AFTER_MS` (22s, +60s post-wake lockout, wake plays 'stretch'); else roll perch (0.7) / peek (0.15 disjoint slice) / plain roam. Priority: talking handoff snaps > everything; celebration only when parked. |
| Idle variety | `src/hooks/interactions/useCompanionIdlePool.ts` | "Tier-B" idle subs = micro-behaviors WITHIN the idle state (`COMPANION_IDLE_SUBS`, 10 entries, 7 with their own clip). Picked from a **fair SHUFFLE BAG** — every sub plays once per pass before any repeat, reshuffle guards the seam against a back-to-back repeat. `peekSpecific()` lets the nap controller force 'doze'/'stretch'. (No Tier-A system — sit/peek are walk arrival actions only.) |
| Per-page beats | `src/hooks/interactions/useCompanionContextBeat.ts` | One walk-to-element beat per route landing: Home→peek at hero portrait (left side, enabled only while narration is NOT playing — the talking handoff outranks it), About→sit at timeline, Skills/Projects→peek at first card, Contact→sit at card. |
| Cursor encounter | `src/hooks/interactions/useCompanionCursorEncounter.ts` | notice (<180px, 300ms) → walk over → wave (or high-five if <90px) → dormant. Fine-pointer devices only. |
| Cross-feature channels | `src/hooks/interactions/CompanionContext.tsx` | talking handoff (HomePage narration), context-beat requests, celebration requests (nonce-gated). |
| Container physics | `src/components/effects/CompanionCharacter.tsx` | Wrapper chain `.companion > __stage (cursor tilt) > __squash (stiffness 200/damping 10, deliberately underdamped) > __bob (stride bob −4px·\|sin(π·phase)\| + rock 2° + hop arc) > __float (breathe/drift) > player`. Feet-anchored `transform-origin: 50% 100%`. |
| Asset layer | `src/components/effects/AnimatedMascotPlayer.tsx` | `POSES` — a single webp-only table (src, `nativeFacing`, `facingMode`, kind 'img'\|'video'); 200ms AnimatePresence crossfade; two-tier preloading (idle+walk+run immediate, rest at browser idle, skipped under Save-Data). **Adding/replacing a state: run the new clip through `scripts/normalize_clips.py` FIRST (see size-lock note), drop the output in `public/assets/mascot/`, add its `POSES` line.** |
| Clip size lock | `scripts/normalize_clips.py` | Every clip is pre-normalized to ONE canvas aspect (260×360 = 0.722) with the robot's HEAD at a uniform size (head-width invariant — pose-stable, unlike bbox height) and feet/contact on a fixed baseline. The CSS pose box is then a fixed `object-fit: contain; object-position: bottom center` box sized from `--companion-pose-aspect`, so clips can't shrink/grow on swap. Peek is excluded from head-normalization (authored partly off-edge). **Any new clip MUST go through this or it will resize the mascot.** |
| Clip playback speed | `scripts/slow_clips.py` | Clips play at their **native ~9fps (116ms/frame)** — the earlier 1.4× slowdown was undone (looked too slow/choppy). `slow_clips.py <factor>` multiplies frame durations and **COMPOUNDS** (each run again), so to change speed compute the factor from the CURRENT speed. ⚠️ Pillow CANNOT read WebP frame durations back (returns None) — the script reads them from the raw WebP ANMF bytes. **Re-running normalize_clips.py resets speed to native — re-apply any slowdown after a re-normalize.** FSM one-shot holds (COMPANION_ARRIVAL_MIN_HOLD_MS, COMPANION_CELEBRATE_MS, COMPANION_SIT_DOWN_MS) are sized to the native durations. |
| CSS | `src/app/App.css` | `.companion` block, `.companion__scale` (bottom-origin perch scale), mobile overrides, mobile footer reservation. **Mobile perf** (≤767px): `.grain` (mix-blend overlay) and `.beam` (spinning conic-gradient) are `display:none` — costly per-frame GPU repaints, imperceptible on phones. `[data-tilt]` `will-change:transform` is set from `useTilt.ts` only WHILE tilting (was leaked page-life). Fonts load non-render-blocking (`index.html` `media=print`/onload swap). |

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
   `padding-bottom: calc(104px + 64px) !important` — the `!important` is required
   to beat Bootstrap's `.py-4 !important`, and the first term must equal
   `COMPANION_SIZE_MOBILE`. This is what makes the corner pocket *guaranteed*
   text-free.
7. **Size changes**: touch `companionConfig.ts` AND the hand-synced CSS spots
   (fallbacks in `.companion`, mobile `--companion-size`, footer calc). Current
   default is **132px** (fit-shrinks to an 88px floor on tight perches). At
   132px gutter-roaming needs ≥1872px viewport (formula `1280 + (16·2 + size)·2`),
   so most laptops roam by PERCHING not gutters — that's fine, perch needs no
   gutter. Going bigger widens the shrink range and the roam threshold.
8. **Respect the `POSES` table's facing rules**: frontal/direction-agnostic
   poses (incl. climb) are `facingMode: 'fixed'`; peeks are edge-driven and
   authored right-edge-native; locomotion clips are authored facing RIGHT
   (mirror at conversion if a clip faces left — never flip the table entry).
9. **Reduced motion**: companion is `display: none` under
   `prefers-reduced-motion` and the FSM's `enabled` is false — keep both.

## 4. Animation clip pipeline (the active workstream)

**SOURCE CLIPS ARE BACKED UP IN THE REPO:** the raw AI-generated `.mp4`
masters + `SEED-use-this-image-for-all-clips.png` live in **`assets-src/maska
bhai/`** (root, NOT `public/` — so they travel with every `git clone` but are
NOT bundled into the deploy). See that folder's README.txt. The site loads only
the processed WebPs in `public/assets/mascot/`. To add/replace a clip: drop the
new `.mp4` in `assets-src/maska bhai/`, run the pipeline below, output lands in
`public/assets/mascot/`.

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
single-orientation art, barely noticeable at the mascot's size.

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
jump, climb, pointing/talking, high-five, plus extra idle variants. `jump` is
wired (perch-far-end hop, idle sub). `climb` is now wired too — the mascot
clambers up the hero portrait's LEFT edge (see the climb-mission changelog entry
below); only wire further new states if the owner asks.

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

**Biggest open win — RE-ENCODE THE MASCOT CLIPS (owner's call, awaits go-ahead).**
`public/assets/mascot/` = **~9.6MB** across 18 WebPs, the dominant payload and
the #1 mobile-load lever. The clips are 260×360 but display ~104–132px, so they
oversample 2–3×. A background test (see prior session) confirmed:
- 230px / q68 → **~5.3MB** (−45%, full retina crispness), or
- 160px / q65 / 8fps → **~3.3MB** (−65%, still no visible loss at ≤132px).
Do it INSIDE `scripts/normalize_clips.py` (lower CANVAS_H / quality) so the
size-lock + head-normalization are preserved. **MUST re-apply native speed
after** (re-normalize resets to 1×; note Pillow can't read WebP durations —
read them from raw ANMF bytes). Verify quality visually per clip before keeping.
Related: gate mobile clip warmup to only the clips the corner buddy plays.

**Also open:**
1. **Optional regenerations** (seed with `SEED-use-this-image-for-all-clips.png`):
   `idle-look` (old clip unusable — spotlight bg + drift; wiring ready, follow
   idleStretch pattern); `run` (shipped but slightly off-model — replace by
   overwriting `mascot-run-anim.webp`, no code change).
2. **~10MB unreferenced AI-Portrait PNGs in `public/images/`** ship in every
   deploy but nothing loads them — move out of `public/` (repo/deploy cleanup,
   not a render win; they're the owner's source files, so move don't delete).
3. **Deferred code-quality items** (real, held back to avoid rushing
   load-bearing code — each deserves its own verified pass): fold the two
   per-walk rAF loops (FSM + CompanionCharacter bob/arc) into one; suspend the
   walk rAF loop when idle (battery); `useCompanionCursorEncounter` re-subscribes
   its pointermove on every reducer state change (move phase to a ref); talking
   overloads `fsmPhase='idle'` (give it a real 'parked' phase); `sittingCross`
   is fully wired but never emitted (remove or wire).
4. **Tuning knobs** (all in `constants.ts`, if behavior feels off): perch
   frequency `COMPANION_PERCH_CHANCE` (0.7); traverse pace
   `COMPANION_TRAVERSE_STEP_PX` (170) / `_HOLD_MS` (550); nap timing
   `COMPANION_NAP_AFTER_MS` (22s); idle-sub mix `COMPANION_IDLE_SUBS` (10
   entries, 7 with a clip — duplicate calm subs if he feels too hyperactive).
5. Standing: keep this file AND README.md updated at the end of every session.

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
- **2026-07-17 (critical fixes)** — Three live-demo bugs fixed. (1) GREEN
  FLASH on peek: root cause was the loop-seam crossfade blending RAW RGB —
  transparent pixels still carried the green wall color, so tail frames
  glowed green each loop (plus resize fringing from alpha-0 green
  neighbors). Re-keyed (scripts/out rework_peek_v2 pattern: global despill,
  zero RGB under alpha<10 BEFORE resize, no seam blend) with a hard audit —
  the encode is only accepted at ZERO green pixels; live screenshots also
  scanned clean. LESSON for all future loops: never crossfade-blend raw RGB
  where alpha=0; zero it first. (2) FEET: COMPANION_PERCH_FOOT_OFFSET_PX=10
  sinks the container so feet touch borders (crops carry ~8px pad+shadow);
  perch missions are now ROUTED via a same-row gutter ramp (5 legs) so no
  leg beelines through paragraph text; surface legs set WalkArc.suppressArc
  and the renderer skips the hop arc (feet stay planted). Verified: bottom
  minus border-top = 10.0px exactly. (3) LIVELINESS: inactivity controller —
  no input for 8s (COMPANION_NAP_AFTER_MS) → dozes IN PLACE, re-checked
  every 4s, any input wakes him (verified live both ways); cursor-greet
  cooldown 45s (was waving on loop at a lingering cursor); idle pool
  rebalanced 15→10 subs (7 of 10 picks now land on a distinct clip — the
  removed subs were visual no-ops; re-adding idle-look later = new sub +
  idleStretch pattern). NOT pushed.
- **2026-07-17 (pre-test review)** — Multi-agent review (4 dimensions ×
  adversarial verify, 22 confirmed of 30 raw). FIXED: (bug) celebration during
  the peek relocate's 350ms hidden settle canceled the relocate and cheered
  off-screen — added missionActiveRef (true from a mission's first step until
  the queue fully drains, incl. the relocate) and the celebration handler now
  refuses while it's set; (leak) applyCompanionSizeCssVar leaked a resize
  listener (no cleanup, doubled under StrictMode) — now returns an unsubscribe
  that CompanionRoamer's effect calls; (perf) tilt onMove read offsetWidth
  (forced reflow) every global pointermove → companionSizeFor; arrival loop
  used sqrt for velocity → squared compare; removed the dead per-frame
  --stride-phase CSS write + the whole distance-accumulating stride block
  (nothing consumed it — walk/arrival re-verified live still fires); (deadcode)
  deleted COMPANION_IDLE_HOLD_MIN/MAX_MS, COMPANION_STRIDE_BOB_PX/ROCK_DEG,
  COMPANION_STRIDE_LENGTH_PX; fixed stale "static PNG"/"stride bob" comments in
  App.css, constants.ts, CompanionCharacter.tsx. DEFERRED (each needs its own
  verified pass — see work queue): merge the two per-walk rAF loops; suspend
  the walk rAF loop when idle (battery); cursor-encounter listener re-subscribes
  on every reducer state change; talking overloads fsmPhase='idle'; sittingCross
  fully wired but never requested; asset re-encode (~9.9MB). All gates green.
  NOT pushed.
- **2026-07-17 (size lock + shuffle + sleep)** — (1) CLIP SIZE SHIFT fixed at
  the ASSET level: clips varied 70–99% body-height-of-canvas, so the
  height-sized container made the mascot shrink/grow on every swap.
  `scripts/normalize_clips.py` re-normalizes all clips to one canvas
  (260×360, aspect 0.722) using a HEAD-WIDTH invariant (rigid across poses;
  bbox height isn't) back-calibrated so standing clips stay ~86% body, scale
  clamped 0.82–0.90 to guard noisy profile-head reads, feet/contact anchored
  to a fixed baseline (peek excluded — authored off-edge). CSS pose box is
  now `object-fit: contain; object-position: bottom center; transform-origin:
  bottom center`, width from `--companion-pose-aspect` (set in
  companionConfig). Rendered-height variance dropped 29%→~12% (the residual
  is CORRECT: seated/crouched poses are genuinely shorter). (2) SHUFFLE:
  useCompanionIdlePool is now a fair shuffle bag — verified 500 picks =
  exactly 50 each, 0 immediate repeats, max-gap 19 (optimal). (3) SLEEP:
  nap threshold 8s→28s (COMPANION_NAP_AFTER_MS), 60s post-wake lockout
  (COMPANION_WAKE_LOCKOUT_MS) so a jittery cursor can't ping-pong him,
  wake plays a 'stretch' reaction (COMPANION_WAKE_REACTION_SUB via
  idlePool.peekSpecific). All gates green; CDP-verified: dozed at 33s (not
  early), woke into stretch; size band tight across 8 poses. NOT pushed.
- **2026-07-17 (size/width/fit + full re-verify)** — Content widened to
  `min(90%, 1760px)` on all pages (side gutters mostly gone). Mascot bumped to
  **132px default** with **dynamic fit-shrink** (COMPANION_SIZE_FIT_FLOOR 88):
  `fitSizeFor` in companionPerch shrinks him to fit a tight border instead of
  skipping it (movement never stops), rendered as a **bottom-origin CSS scale**
  on `.companion__scale` via `perchScaleRef` — feet stay planted (resizing the
  fixed box would drop them). Perch decoupled from `hasGutterRoom` (walks on
  element tops, needs no gutter) so he roams via perching at any width. Clips
  confirmed at **1.4× (162ms/frame)**; one-shot FSM holds re-tuned to match
  (wave 4.4 / highFive 4.2 / celebrate 5.2 / sitDown swap 6.6 / sitting 8.0s).
  Nap threshold 28→**22s** eligibility (effective sleep ~22-34s: a perch
  mission in flight finishes first with the slower walk clip); `idleHoldMs`
  caps the idle hold so the nap check lands promptly. FULL re-verify: all 4
  gates green; CDP — content 83% wide on all 5 pages; mascot 132px, shrinks to
  0.96 on narrow cards, feet at 10px at every size; 78 border-frames/50s (walks
  on content); peek ZERO green (2 samples); sleep + stretch-wake; mobile 64px
  zero text-overlap; reduced-motion hides him. NOT pushed.
- **2026-07-19 (roam-variety + perf pass)** — FIXED: mascot appeared "not
  moving" on laptop/1440 screens — his between-mission REST always snapped to
  the one fixed corner (no side gutter at 132px). Added `variedRestPoint`
  (companionZones) — desktop no-gutter rest now picks a varied bottom-band x,
  so idle positions spread across the page (verified 5 distinct x's vs 1
  before); mobile keeps the fixed corner. Clip speed normalized back to native
  ~9fps (116ms/frame; the 1.4× slow looked choppy) and one-shot FSM holds
  re-tuned to the faster clips. PERF (verified audit, safe wins applied): mobile
  now `display:none` on `.grain` (mix-blend overlay repaint) and `.beam`
  (spinning conic-gradient) — both imperceptible at phone size, costly on
  mobile GPUs; `[data-tilt]` `will-change:transform` moved out of base CSS into
  useTilt (promote on enter, release on leave — was leaked page-life); Tier-1
  mascot warm trimmed idle+walk only (run deferred, never a first gait);
  Google Fonts stylesheet made non-render-blocking (media=print/onload swap).
  Content-width fix from the prior turn also in (page-shell padding + container
  min(100%,1760px) so text reaches the borders). All gates green; CDP-verified
  mobile/desktop FX gating + roam variety. NOT pushed.
  DEFERRED for owner (both real, both bigger calls): (1) re-encode the 18
  mascot clips at lower res/quality — audit's Pillow tests show ~9.6MB→~3.3MB
  with no visible loss at 132px; must PRESERVE native speed (re-normalize
  resets it) — biggest single mobile-load win. (2) gate mobile clip warmup to
  only the clips the corner buddy actually plays (idle/walk/run/jump/peek +
  idle-subs), deferring wave/highfive/celebrate/pointing/sit/climb — one
  ~10-line guard in warmUpMascotSources. Also: ~10MB unreferenced AI-Portrait
  PNGs in public/images/ ship in every deploy (move out of public/ — repo/deploy
  cleanup, not a render win).
- **2026-07-19 (walk on the hero heading)** — Added `.hero-title` (the big
  "Hi, I am Naseeruddin Shaik" H1) to PERCH_SELECTORS so the mascot walks on it
  too. Fixed a text-perch gap: a heading's glyphs overflow ~17px ABOVE its box
  top (font ascent), so standing at box-top left the feet floating above the
  letters. companionPerch now lifts the perch line by TEXT_ASCENT_LIFT_PX (17)
  for text targets (isTextTarget: H1/H2/H3/.hero-title/.section-title) so feet
  land ON the letters — verified feet-to-text gap 17px→5px. Cards/image borders
  (box top IS the visible edge) get 0 lift. Gates green; movement + perch
  re-verified. NOT pushed.
- **2026-07-19 (stepped hero traverse)** — Fixed the mascot darting across the
  hero heading in one fast slide ("too fast, only one movement, not walking the
  whole words"). A perch traverse over a WIDE element was a single spring leg
  from near-end to far-end — over ~740px that reads as one dart. Now the
  traverse is split into steps of COMPANION_TRAVERSE_STEP_PX (170) with a
  COMPANION_TRAVERSE_STEP_HOLD_MS (550) pause before each, via a new `pauseMs`
  field on the mission walk step (honored in consumeMissionStep: sets idle +
  a phaseTimeout before starting the leg; note idle-arrival ignores holdMs, so
  pauseMs is the correct lever). Verified live on home: he walk-stops-walks
  x=184→401→777 across the hero-title span at y=84 (feet on the letters), ~2-3s
  per step. Intermediate steps are fixed points (not scroll-re-anchored) — fine
  for a brief traverse; the near/far ends still re-anchor. Gates green; movement
  + perch re-verified. NOT pushed.
- **2026-07-19 (perch-scale leak fix)** — Fixed the mascot rendering SHRUNK
  while standing/idle at the top of the hero (user screenshot: small robot at
  the ticker row with space to spare). Root cause: a perch on a narrow element
  set perchScaleRef < 1, and when the mission drained into GENUINE idle (queue
  empty, no next step to reset it via `?? 1`), the shrunk scale leaked into the
  standing/idle/peek pose. Fix: `enterIdle` now force-resets perchScaleRef to 1
  when no mission step is consumed — belt-and-braces so a shrink can never
  persist outside an active perch surface leg. Verified: scale=1 in every state
  over 2min incl. the top band; rendered pose height 139px (full) on the hero.
  Gates green. NOT pushed.
- **2026-07-19 (feet on the bottom edge)** — Fixed the mascot floating ~16-24px
  ABOVE the viewport bottom when resting/roaming down there (user: should look
  like he's standing ON the bottom/taskbar, not hovering). The bottom positions
  used `viewportHeight - EDGE_INSET - size` (16px gap) plus the clip's ~8px
  transparent foot padding. Added `bottomStandY(vh, size)` in companionZones =
  `vh - size + COMPANION_PERCH_FOOT_OFFSET_PX` so his VISIBLE feet touch the
  bottom edge; used it in fixedCornerPoint + variedRestPoint. (randomSafePoint's
  gutter band bottom is a roam RANGE, not a standing edge — left as-is.)
  Verified: container bottom 884→910 at vh900 (feet now at ~900, the edge);
  mobile corner feet at 842/844 with ZERO text overlap (footer reservation
  still holds). He also actively roams the bottom band (11 distinct x, all
  activities: walk/run/jump/peek/dance/stretch/think/doze/exercise). Gates
  green. NOT pushed.
- **2026-07-19 (mobile size fix + source-clip backup)** — FIXED: Maska Bhai
  rendered TINY on phones (user: "very very small in mobile view"). Root cause:
  `COMPANION_SIZE_MOBILE` was 76 in JS, but the `.companion` block in App.css's
  ≤767px media query hardcoded `--companion-size: 64px`, overriding the JS-set
  var — so he showed at 64px on every phone. Fix (3 hand-synced spots, per
  invariant 6–7): (1) `COMPANION_SIZE_MOBILE` 76→**104**; (2) removed the
  hardcoded `--companion-size: 64px` from the mobile `.companion` block (kept
  `filter: none`) so JS is the sole source; (3) footer reservation
  `calc(64px + 64px)`→`calc(104px + 64px)`. CDP-verified at 360/390/430px: all
  render 104px (24–29% of width, biggest on the narrowest phone but still
  readable) with **ZERO text overlap** and feet on the bottom edge; 390px
  screenshot confirms proper on-model size. ALSO: original source clips (19 mp4
  + SEED png, ~55MB) backed up to **`assets-src/maska bhai/`** (repo root, NOT
  public/ — CRA would copy public/ into build/ = 55MB dead deploy weight) so
  every `git clone` carries them; excluded from build (verified 0 mp4 in a fresh
  build). Gates green. NOT pushed.
- **2026-07-20 (mobile perch: no more hopping off the text)** — FIXED: on phones
  the mascot "jumped far, position far upper than the text" instead of standing
  ON the name (user screenshot: floating in empty space above the hero heading).
  Root cause: the perch mission ends the top-edge traverse with a `hopping`
  arrival action — a real jump-arc that lifts the visible pose ~80px off the
  border (CDP: pose bottom 215→133 during the hop). Playful on a wide desktop
  heading with whitespace above; on a narrow mobile heading (~334px, mascot
  104px) the hop launches him well above the letters, and the stop-start
  `pauseMs` steps look jittery on the short span. Fix (`useCompanionBehavior.ts`
  perch-mission builder): when `w <= COMPANION_MOBILE_BREAKPOINT`, the far-end
  leg arrives `'idle'` (no hop) and the traverse is a single leg (`steps = 1`,
  no pause-steps) — he walks the name calmly and STOPS on it. Desktop keeps the
  stepped traverse + celebratory hop unchanged. CDP-verified at 393px: feet land
  at gap **+7px** on the "Hi, I am" line and STAY there (pose bottom pinned at
  215 = the heading top), no jump to 133; screenshot confirms he stands on the
  name. Gates green. NOT pushed.
- **2026-07-20 (climb the photo's left edge like a ladder)** — NEW behavior: the
  mascot now clambers UP the LEFT border of the hero portrait, playing the climb
  clip, so it reads as a real ladder climb. The climb clip + `climb` gait +
  renderer handling all already existed, but NO mission ever produced a vertical
  leg, so the gait never fired in practice. Added (`companionPerch.ts`):
  `measureClimbSpan(el)` — a bottom→top vertical span up the element's left edge,
  container x centred on the edge line and CLAMPED to `EDGE_INSET` so it never
  hangs off the left viewport edge (on a narrow phone the photo is ~30px from the
  edge; un-clamped, half of him would climb off-screen); and `findClimbTarget()`
  — gates on the portrait being tall enough (`climbRun ≥ COMPANION_CLIMB_MIN_
  VERTICAL_PX`, ~311px mobile / 483px desktop), fully on-screen, border ≥
  EDGE_INSET from the edge. Wired a CLIMB sub-branch into the perch roll
  (`useCompanionBehavior.ts`): when a ladder target is on-screen a perch roll has
  `COMPANION_CLIMB_CHANCE` (0.4) to run ramp→foot→**climb up**→summit hop
  (`COMPANION_CLIMB_SUMMIT_HOLD_MS`)→**climb down**→settle instead of a top-border
  traverse. The up/down legs are steep, so requestWalk's existing gait detector
  auto-selects the climb clip; `onSurface: true` suppresses the hop arc so feet
  track the edge like rungs. Climb legs are FIXED points (not scroll-re-anchored)
  — the climb is brief and the hero sits at the top of the page, so no new
  vertical-axis anchor plumbing was needed. CDP-verified: desktop climb centres
  EXACTLY on the photo left edge (cxCenter 970 = photoLeft 970), 483px vertical
  sweep up+down; mobile hugs the border on-screen (clamp working). Gates green.
  NOT pushed.
- **2026-07-20 (climb the VISIBLE portion + clip audit)** — REFINED the climb so
  it actually fires on phones: the first version required the WHOLE portrait
  on-screen (`rect.bottom <= viewportHeight`), but the 415px photo never fits
  under the navbar on an 852px phone, so the climb essentially only triggered
  when deep-scrolled. Per owner ("overlap during movement is fine — his motion
  matters more than hiding a line of text"), `findClimbTarget`/`measureClimbSpan`
  now work off the VISIBLE vertical range (new `climbFeetRange`: bottom foot =
  min(rect.bottom, viewport floor), top foot = max(rect.top, navbar line)) and
  gate on the ON-SCREEN run (`visibleRun >= COMPANION_CLIMB_MIN_VERTICAL_PX`),
  not the full height. He climbs whatever chunk of the left edge is visible,
  overlapping page text on the way (intended). CDP-verified: mobile now climbs
  at a normal scroll (feet sweep 518→845, 327px, cxCenter 68 hugging photoLeft
  30); desktop climbs at the top of the page (photo visible there) and stops
  once it scrolls off. No size shrink — full scale on the open left edge.
  ALSO — full CLIP AUDIT (subagent trace of every pose trigger): all 19 pose
  clips are REACHABLE and wired (idle + 6 idle-sub variants, walk, run, climb,
  jump, pointing/talking, peek×2, sit + sitDown, wave, highfive, celebrate). The
  3 plain idle subs (blinking/weightShift/smilePulse) intentionally fall back to
  the base idle loop. Only cosmetic dead code: the `sittingCross` BEHAVIOR value
  is never triggered (all sit beats use `sitting`), but its `sit` clip is
  reachable via the normal sitting path — so NO clip is orphaned. Left as-is
  (harmless; removing it is churn for no behavior change). Gates green. NOT
  pushed.
- **2026-07-20 (step-by-step climb + walk rhythm)** — FIXED two motion feel
  issues the owner flagged: (1) the climb glided up FAST and stalled ~10% short
  of the top, doing the summit beat mid-edge; (2) walk/climb should read as
  actual STEPS. Root cause of the short-stop: the climb was ONE spring leg
  bottom→top; the lazy spring eases out and arrival detection (dist<6 &
  vel<30) fires before the visual top. Fix — RUNGS: `climbRungs(from,to,rungPx)`
  (companionPerch) splits the run into ~`COMPANION_CLIMB_RUNG_PX` (46px) legs,
  the LAST rung's target === the exact top, so he always reaches it and only
  THERE does the summit hop. Each rung is a short leg with a
  `COMPANION_CLIMB_RUNG_HOLD_MS` (240ms) grip-pause that HOLDS the climb pose
  (new mission-step `pauseGait`, honored in consumeMissionStep — a rung-pause
  now shows the climb clip, not idle-in-mid-air). Short rungs are <220px so the
  auto steep-check would mislabel them 'walk' — new `WalkRequest.forceGait`
  pins 'climb' per leg. Walk traverse: re-enabled STEPPING on mobile too (was
  1 leg after the earlier text-perch fix) with a 0.6× smaller mobile step so a
  narrow heading still gets a few gentle steps (far-end hop still dropped on
  mobile); traverse step-hold 550→**320ms** so it reads as a walking rhythm,
  not full stops. CDP-verified (desktop): climb shows 10 distinct stop-go
  plateaus over a 442px run, highest feet 226 vs photoTop 170 (feet AT the top),
  summit hop fires at the top; screenshot confirms he ends at the top-left
  corner. Walk traverse shows ~19 x-plateaus (real step-stop-step). Gates green.
  NOT pushed.
- **2026-07-20 (climb border alignment)** — FIXED: while climbing he sat INSIDE
  the photo (owner: "not at the border properly, going inside the image area").
  Root cause: `measureClimbSpan` put the CONTAINER centre on the left-edge line,
  but the visible art is centred in the container, so his BODY centre landed on
  the border — half his body inside the image (CDP: art 924→1016, border 970 →
  46px inside). Fix: align by the VISIBLE art (width = `full × COMPANION_POSE_
  ASPECT`), placing its RIGHT edge `CLIMB_BORDER_OVERLAP` (6px) past the border
  so he hugs the edge from OUTSIDE with just his grip on the frame; clamped to
  EDGE_INSET so the container never runs off-screen. CDP-verified desktop: art
  881→975 vs border 970 — only 5px into the image, body centre (928) in the
  gutter (screenshot: he stands just outside the frame, ladder-style). Mobile:
  the 30px gutter is thinner than he is (~75px), so full outside-fit is
  impossible — he now hugs with his LEFT edge on the border (imgLeft 32 vs
  photoLeft 30) instead of bisected by it, the best the geometry allows (and
  movement-overlap is acceptable per prior owner guidance). Gates green. NOT
  pushed.
- **2026-07-20 (climb aborts on scroll — page-state awareness)** — FIXED: if the
  user scrolled mid-climb, the mascot kept clambering in mid-air over whatever
  scrolled into view (owner screenshot: still climbing on a stats card after
  scrolling to the bottom). Root cause: climb RUNGS are fixed points (a vertical
  clamber can't cheaply scroll-re-anchor like a horizontal top-edge perch, which
  DOES track scroll via `anchorEl`/`measurePerchSpan`), so the photo moved out
  from under them but the mission ran on. Fix: a climb mission now records its
  photo element (`missionClimbElRef`, cleared in `clearMission`), and the scroll
  handler aborts the ENTIRE climb on ANY scroll while climbing —
  `clearMission` + walk to a fresh `pickStandingPoint()` for the new page state.
  (Any scroll, not just "photo fully gone": even a small shift makes fixed climb
  points stale, and a committed vertical clamber over a moving photo always reads
  wrong.) CDP-verified: scroll-to-bottom mid-climb → climb clip drops to idle
  within ~250ms, he walks from the stale spot (cx 928→459) to the bottom edge and
  settles; ZERO frames climbing over the off-screen photo; screenshot shows him
  resting by the footer. Perch top-edge traverse was already scroll-anchored, so
  only the climb needed this. Gates green. NOT pushed.
- **2026-07-20 (mobile climb alignment — edge-line fallback)** — FIXED: on real
  phones the climb-alignment fix still put him INSIDE the image. The desktop fix
  aimed his visible RIGHT edge just past the border (body fully in the gutter),
  clamped to EDGE_INSET — but the phone gutter (~30px) is far thinner than he is
  (~75px visible), so the clamp centred his body inside the photo. Physically he
  can't stand fully outside on mobile. Owner chose (AskUserQuestion) "climb on
  the border line with some overlap." Fix (`measureClimbSpan`): two regimes —
  wide gutter keeps the outside-hug (visible right edge 6px past the border,
  body in the gutter); narrow gutter falls back to the visible LEFT edge exactly
  ON the border line (`edgeLineX = rect.left − (full−visibleW)/2`), so he
  overlaps into the image but clearly climbs the EDGE instead of being centred
  inside it. CDP-verified mobile (393): visible left edge 31 vs photoLeft 30
  (leftEdgeVsBorder = 1px); screenshot confirms he hugs the left border. Desktop
  unchanged (outside-hug: art 881→975 vs border 970). Gates green. NOT pushed.
- **2026-07-20 (shrink mobile hero photo → open the climb gutter)** — Instead of
  accepting the mobile overlap above, the owner asked to make the PHOTO smaller
  so the mascot gets real gutter to climb OUTSIDE the border. Design (workflow +
  live CDP modeling): the outside-hug needs the photo's left edge ≥ ~100px from
  the screen edge (`measureClimbSpan` outsideHugX threshold, mobile full=104 /
  visW=75). Photo was full-width (~30px gutter). A CSS-only cap does it — added
  in the ≤767px block (`App.css` ~1574):
  `.hero-portrait-wrapper, .hero-sidebar .hero-quick-card { width:100%;
  max-width:260px; margin-inline-start:auto; }`. **`width:100%` is REQUIRED** —
  `.hero-sidebar` is a flex COLUMN, so a bare `max-width` child shrinks to
  min-content (collapsed the photo to 12px in testing). Right-align pools the
  freed space on the LEFT (the climb side); the Quick-paths card is capped to
  match so the column stays aligned. Height auto-follows via aspect-ratio 4/5
  (~316-322px, well over the 220px climb-run floor). CDP-verified: 390px+ phones
  now get 100-124px left gutter → mascot hugs FULLY OUTSIDE (body right edge 5px
  past the border, bodyOutside=true, screenshot confirms); 360/375px get 73-88px
  → overlap cut from ~45px to ~6-13px (full hug not geometrically possible on the
  smallest phones without dropping the photo below the climb floor — 260px is the
  sweet spot). Climb still fires on all phones. Desktop/tablet untouched (cap is
  ≤767px only; verified maxW:none at 768/1024/1440). Gates green. NOT pushed.
- **2026-07-26 (pre-production adversarial bug hunt — 3 real bugs fixed)** — Ran a
  parallel finder + independent-verifier review of the whole mascot FSM. 3 real
  bugs survived verification (1 refuted):
  1. **Climb scroll-abort missed 'recovery' + grip-pause 'idle' phases** (HIGH,
     `useCompanionBehavior.ts` scroll handler). The abort added earlier only fired
     for phase `walking`/`arrived`/`anticipation`, but a STEPPED climb spends ~half
     its time BETWEEN rungs (recovery 260ms + grip-pause 240ms, phases
     'recovery'/'idle'). Scrolling in those gaps skipped the abort → the pending
     rung timer resumed onto the scrolled-away photo (the very bug the abort was
     meant to fix, reintroduced by the rung-stepping change). Fix: dropped the
     phase whitelist entirely — abort on ANY scroll while `missionClimbElRef` is
     set; `clearPhaseTimeout` cancels the pending rung timer. Verified: climb
     switches to walk/idle within one crossfade (~0.5s) in all phases; no more
     advancing to new rungs over off-screen content.
  2. **Abort walk-away could replay the climb clip** (MEDIUM, same spot). The
     escape walk to a standing point could be steep → auto-gait re-picked 'climb'
     → "climbing down through empty space." Fix: `forceGait: 'walk'` on the abort
     walk.
  3. **Perch traverse mid-step legs walked to STALE points on scroll** (HIGH,
     pre-existing). The stepped top-edge traverse's intermediate legs were fixed
     points with no `anchorEl` (only near/far legs re-anchored), so scrolling
     mid-traverse sent him to stale coordinates. Fix: mid-steps now carry
     `anchorEl` + a new `anchorFrac` (0..1 along the span); the scroll re-anchor
     lerps the freshly-measured start/end at that fraction (new
     `missionAnchorFracRef`, reset in `clearMission`). Verified: after an 80px
     scroll his feet re-settle to 10-24px from the moved card top.
  Residual (NOT a bug, left as-is): after a climb-abort the climb CLIP lingers
  ~0.5s as it crossfades (COMPANION_POSE_CROSSFADE_S 150ms + 220ms anticipation)
  — the mission is genuinely aborted (no new rungs), only the pose fades out;
  hard-cutting the crossfade is more complexity than the off-screen visual gain.
  Full gate suite green + production-build smoke test (mascot mounts, poses load,
  ZERO console errors / network failures, survives 5-route tour, reduced-motion
  hides him) on both mobile+desktop. NOT pushed.
- **2026-08-01 (long-scroll Home landing + separate pages coexist)** — Owner
  wanted the HOME page to scroll through ALL sections top-to-bottom, while the
  nav buttons STILL load each section as its own standalone page (both modes).
  Lazy impl (reuse, no new components): `app/routes.tsx` `home` renderer now
  returns the hero (`<HomePage>`) followed by `<AboutPage>/<SkillsPage>/
  <ProjectsPage>/<ContactPage>` stacked, each wrapped in `<section id="home-*">`
  (prefixed so the ids never collide with the router's own `#about`/… hashes).
  The other four renderers are unchanged, so clicking a nav button still routes
  to the standalone page. One shared gotcha handled: each page fires a mascot
  `useCompanionContextBeat` ON MOUNT; five at once on Home would stomp each other
  (last-write-wins), so a new optional `beatEnabled` prop (default true → stand-
  alone pages unchanged) is passed `false` for the stacked copies. The mascot
  still roams the whole scroll via its normal autonomous perch/climb on
  `.section-title`/`.card`/`.hero-portrait-wrapper` (which every section has).
  CDP-verified: Home docHeight ~8000px desktop / ~14000px mobile, all 4
  home-* sections present in order, hero present; nav to `#about` still yields
  the short standalone page (no home-about); mascot TOURED down the scroll —
  perches/walks/climbs on real elements at every depth (projects card gap 7px,
  contact section-title gap 1px), on-screen throughout, ZERO console errors;
  prod-build smoke test clean (all sections mount, mascot mounts, no real net
  failures) mobile+desktop. Files: routes.tsx + the 4 page components (beatEnabled
  prop). NOT pushed.
- **2026-08-01 (mascot roams ALL text) + footer social ORBIT** — Two owner asks:
  (1) mascot should walk everywhere on text (headings/paragraphs/list items),
  overlapping if needed. `companionPerch.ts`: widened `PERCH_SELECTORS` to add
  `h1`–`h6`, `p`, `li`, `.lead`, `.pill-label`, `.hero-metric`, `.quick-link`,
  `.timeline-item`; broadened `isTextTarget` to all text tags so the ascent-lift
  seats feet on the letters. Existing width/visibility filters still gate (too-
  narrow/off-screen skipped). CDP-verified he perches on P/LI/H3/H4/etc. across
  the scroll, 200/200 on-screen, 0 errors.
  (2) A pasted shadcn/Tailwind/Next "orbiting-circles" component — INCOMPATIBLE
  with this CRA+Bootstrap+plain-CSS project (no Tailwind classes resolve, no
  `@/` alias, no components.json, and it pulled brand logos off a CDN). Owner
  chose "rebuild in our stack." New `components/layout/SocialOrbit.tsx` +
  `.social-orbit*` CSS in App.css: the 4 real socials ride two counter-rotating
  rings around a glowing core; each icon counter-spins to stay upright (the
  reference's two-layer spin trick), reusing SocialBar's exact icon SVGs +
  link/placeholder rules (layout-only change). Footer.tsx now renders
  `<SocialOrbit>` instead of `<SocialBar>` (SocialBar kept as a 1-line revert
  path, now unused). Reduced-motion freezes the spin. MOBILE: radii shrink via a
  `@media (max-width:767px)` override placed AFTER the base rule (source-order —
  an earlier media block was being overridden by the later base rule; that was
  the one bug found+fixed here). CDP-verified: desktop orbit 259px, mobile 208px,
  fits within 360/390/1440 viewports (no clip), all 4 buttons visible+upright,
  screenshots confirm the orbit on both. Gates green. Files: SocialOrbit.tsx
  (new), Footer.tsx, App.css, companionPerch.ts. NOT pushed.
  FOLLOW-UP FIX: github + facebook (the two INNER-ring buttons) didn't glow on
  hover — the OUTER ring div's full bounding box (visually just a thin border,
  but a big round box for hit-testing) sat over the inner buttons and ate their
  hover (`elementFromPoint` returned `.social-orbit__ring--2`). Fix: rings +
  arms are `pointer-events: none` (decorative), buttons `pointer-events: auto`.
  CDP-verified all 4 now receive hover; forced-:hover shows github shadow+white,
  facebook shadow+#1877f2 blue. Gates green.
  ADDED 5 DECORATIVE brand badges to the orbit (owner ask): slack, gemini,
  chatgpt, telegram, whatsapp — inline SVG logos (no CDN, CSP-safe), NON-links
  (owner chose decorative-only; ChatGPT/Gemini aren't personal accounts), each
  with its own `--brand`/`--brand-rgb` glow (`.social-btn--slack/gemini/chatgpt/
  telegram/whatsapp` in App.css). SocialOrbit.tsx generalized to a unified
  `OrbitItem` model: the 4 real socials (from portfolioData.socialMedia, still
  clickable) + the 5 badges, distributed 4-inner/5-outer across the 2 rings
  (outer has more circumference → more icons). Radii bumped (r1 3.6→4.2rem,
  r2 6.4→7rem; mobile 2.9/5→3.3/5.6rem) so 9 icons don't crowd. CDP-verified:
  inner-ring min edge-gap 31px mobile (was 11 at 5/ring), fits 360/390/1100 no
  clip, all 5 badges glow their brand colour on forced-:hover (slack cyan,
  gemini purple, chatgpt teal, telegram blue, whatsapp green). Gates green.
  Files: SocialOrbit.tsx, App.css. NOT pushed.
  LATER: gemini + chatgpt flipped from decorative to LINKS (owner ask) — href
  https://gemini.google.com / https://chatgpt.com, target=_blank, full
  brightness. Slack/telegram/whatsapp stay decorative. One-line-each in the
  DECORATIVE list; CDP-verified they're real <a> anchors.
- **2026-08-01 (footer "Interactive 3D" Spline spotlight card)** — Another
  shadcn/Tailwind/Next pasted component (Spline 3D robot in a spotlight Card),
  INCOMPATIBLE with CRA+Bootstrap+plain-CSS. Owner chose "add the real Spline
  robot." Installed `@splinetool/react-spline` (v4) + `@splinetool/runtime`
  (framer-motion already present). New files: `components/effects/SplineScene.tsx`
  (lazy wrapper, imports the package ROOT — the `/next` subpath is the only
  Next-specific build — with a Suspense loader + onError), `components/layout/
  SpotlightCard.tsx` (the panel: gradient heading + blurb LEFT, Spline robot
  RIGHT per owner; a mouse-follow radial glow rewritten from the sample's
  Tailwind `motion.*`+cn() to the app's `m.*`+useSpring/useTransform +
  `.spotlight-card__glow` CSS — MUST be m.* under `<LazyMotion strict>`).
  Footer.tsx renders `<SpotlightCard>` above the orbit. Scene streams from
  prod.spline.design CDN. CRITICAL GATE: the runtime is ~4MB of WebGL across two
  LAZY chunks (lazy() import → main.js only +8K, 360→368K; chunks load on card
  mount) AND `SpotlightCard` skips it entirely on phones (innerWidth<=767 OR
  !hasFinePointer — width is the reliable signal; headless/emulated pointer-media
  reports fine even on mobile, that was the one bug found+fixed here),
  reduced-motion, and Save-Data → those get a lightweight `.spotlight-card__orb`
  instead, and onError falls back too. CDP-verified: desktop loads the robot
  (canvas 508×318, scene req OK, 0 errors); mobile shows the orb with ZERO
  heavy spline scene/runtime reqs, card stacks (flex column) + fits 390px;
  build code-splits (main 368K, spline in 1.9M+2.1M lazy chunks). Maska Bhai +
  orbit unchanged (two robots now: the footer Spline demo bot + the roaming
  mascot — owner OK'd). Gates green. Files: SplineScene.tsx, SpotlightCard.tsx
  (new), Footer.tsx, App.css, package.json. NOT pushed.
  REWORKED per owner: NOT a boxed card — BLEND the robot into the footer, remove
  the text, keep only the robot, and it should react to the mouse near the orbit.
  Deleted SpotlightCard.tsx; new `components/layout/FooterRobot.tsx` = a
  transparent absolute layer (`.footer-robot`, inset:0) filling `.site-footer`
  (now position:relative, min-height:460px desktop / 0 mobile, perspective:900px,
  overflow:hidden, radial mask-image to edge-fade — no box). `.footer-inner`
  (orbit+credit) is z-index:1 and pointer-events:none with only a/button/orbit-
  btn re-enabled, so the robot layer (z-index:0, pointer-events:auto) gets
  mousemove through empty areas while orbit clicks still work (CDP-verified
  github clickable:true). MOUSE-FOLLOW: the demo Spline scene's own cursor-rig
  is NOT reliable (couldn't trigger it via CDP/synthetic events — 0% head diff),
  so FooterRobot adds a VERIFIABLE framer-motion parallax: window mousemove →
  normalized [-1,1] from footer centre → spring → x/y (±22px) + rotateX/Y (±6°)
  on the `m.div`. CDP-CONFIRMED the transform responds to the cursor (matrix3d
  translateX -21px @ left vs +20px @ right). NOTE: headless WebGL screenshots
  capture the canvas as static (0% pixel diff even though the transform is live)
  — the parallax WILL show on a real GPU; can't screenshot-verify the pixels
  headlessly. Same phone/reduced-motion/save-data gate; onError → renders
  nothing. Gates green. Files: FooterRobot.tsx (new), SpotlightCard.tsx
  (deleted), Footer.tsx, App.css. NOT pushed.
- **2026-08-01 (footer credit → bottom + neon)** — Owner: move the "© YEAR …
  Crafted with care." credit to the true footer bottom (clear of robot + orbit)
  and give it a neon glow. Credit moved OUT of `.footer-inner` to a direct
  `.site-footer` child; DESKTOP `.footer-credit` is `position:absolute;
  bottom:1.1rem; left:50%` (z-index:2, above the robot), `.footer-inner` got
  `padding-bottom:2.6rem` so the orbit never reaches it. NEON: cyan→violet
  `background-clip:text` gradient + animated multi-layer `text-shadow`
  (`@keyframes footer-neon`, 3.2s pulse); reduced-motion keeps a static glow.
  MOBILE (≤767px): credit reverts to `position:static` (in-flow below the orbit,
  ABOVE Maska Bhai's reserved corner) — an absolute bottom credit COLLIDED with
  the mascot corner (caught in CDP: mascot sitting on "…care."). That mobile
  override MUST come AFTER the base rule (source-order trap again — placed it
  right after the base `.footer-credit`, not in the early ≤767px block).
  BUG CAUGHT + FIXED during this change: my first edit left the early ≤767px
  `@media` block UNCLOSED (missing `}`) → PostCSS "Unclosed block" → the WHOLE
  app rendered blank (footer/everything gone). Always CDP-verify the app still
  mounts after CSS edits. CDP-verified after fix: desktop credit absolute,
  neon anim running, 112px clear of orbit; mobile static, clear of orbit +
  mascot, fits width; screenshots confirm the cyan glow both. Gates green.
  Files: Footer.tsx, App.css. NOT pushed.
- **2026-08-01 (footer variants: big only on landing)** — Owner: keep the big
  footer (robot + orbit + neon) only on the LANDING page (Home); every other
  page gets a NORMAL footer (plain SocialBar icon row + neon credit). Footer.tsx
  now takes `variant: 'landing' | 'normal'`; App.tsx passes `isHome ? 'landing'
  : 'normal'`. 'landing' = FooterRobot + SocialOrbit + bottom-pinned credit on
  `.site-footer--landing`; 'normal' = the pre-existing `SocialBar` (kept as the
  revert component all along) + in-flow neon credit. CSS re-scoped: base
  `.site-footer` is now just border+bg; the robot-height/perspective/overflow/
  relative + orbit pointer-events + absolute-pinned credit all moved under
  `.site-footer--landing`. Neon `.footer-credit` is SHARED (both footers glow),
  in-flow by default, absolute only under landing. The ≤767px landing-credit
  override was re-selectored to `.site-footer--landing .footer-credit` so it
  keeps matching specificity. CDP-verified: #home landingClass=true robot+orbit,
  460px; #skills/#about landingClass=false simpleBar=true, 130px compact, neon
  credit on all. Gates green. Files: Footer.tsx, App.tsx, App.css. NOT pushed.
- **2026-08-01 (pre-prod bug hunt on footer/robot/mobile — 5 real fixes)** —
  Adversarial parallel finders + independent verifiers over the footer work.
  Fixed:
  1. **CRITICAL — Spline load failure white-screened the WHOLE app.**
     `@splinetool/react-spline@4` has NO `onError` callback (it's a phantom DOM
     prop that never fires); on scene/chunk failure (CDN down / 404 / offline)
     it THROWS during render, Suspense doesn't catch throws, and FooterRobot
     sits OUTSIDE the page ErrorBoundary → whole tree unmounts → blank site. Fix:
     `SplineScene.tsx` now wraps the scene in `<ErrorBoundary fallback={null}>`
     (the chokepoint every consumer routes through); removed the dead `onError`/
     `failed`/`setFailed` plumbing. CDP-verified: with prod.spline.design +
     *splinetool* BLOCKED, the app fully mounts, footer shows just the orbit,
     nothing visible breaks.
  2. **ErrorBoundary `fallback={null}` was ignored** — `this.props.fallback ??
     default` treats null as "use default", so it showed the "Something went
     wrong" box in the footer on CDN failure. Fix: `'fallback' in this.props`
     check so an intentional null renders nothing. (Verified: 0 error boxes.)
  3. **Neon credit invisible where `background-clip:text` unsupported** — the
     bare `-webkit-text-fill-color:transparent` overrode the color fallback. Fix:
     moved it into `@supports ((background-clip:text) or (-webkit-...))`.
  4. **Mobile landing footer reserved ~460px dead space** — `min-height:460px`
     (for the robot, gated off on phones) wasn't reset on mobile. Fix: added
     `.site-footer--landing { min-height:0 }` + footer-inner padding reset in the
     ≤767px block (after the base rule → source-order wins). Footer 498→456px.
  5. **Heavy gate never re-evaluated on resize** — resizing desktop→phone left
     the ~4MB WebGL canvas mounted. Fix: FooterRobot `heavy` is now `useState` +
     a rAF-debounced resize listener re-running `shouldLoadRobot()`.
  Also: decorative orbit badges (slack/telegram/whatsapp `<span>`) now
  `aria-hidden` (were exposing a misleading control name to screen readers);
  gemini/chatgpt links keep their labels.
  FULL RE-VERIFY (CDP): 0 horizontal overflow on 5 pages × 360/390/414;
  desktop Home Spline loads; normal-footer SocialBar clickable (pointer-events
  not leaked); all 9 orbit buttons hit-testable; gemini→gemini.google.com /
  chatgpt→chatgpt.com links OK; CDN-blocked → graceful null, app up. All 4 gates
  green, prod build code-split (main 372K). Files: SplineScene.tsx, FooterRobot.tsx,
  ErrorBoundary.tsx, SocialOrbit.tsx, App.css. NOT pushed.
- **2026-08-01 (cinematic scroll intro on Home)** — Owner gave a shadcn/Tailwind/
  Next/GSAP "cinematic-hero" sample (scroll-pinned reveal + iPhone app mockup);
  chose: cinematic INTRO then normal scroll, ADD gsap, card features the REAL
  hero (not the fake app). Installed `gsap`. New `components/effects/
  CinematicIntro.tsx` (adapted to plain CSS + site tokens, NO Tailwind/cn):
  GSAP ScrollTrigger pins the opener for ~2600px of scroll — hero tagline
  (silver-gradient) reveals, a deep-blue card rises + expands to fill, shows the
  REAL photo/name/tagline/summary + the 4 portfolio metric chips + View-projects/
  Get-in-touch (navigate), mouse-follow sheen, then the card pulls back + lifts
  away → pin releases into the existing long-scroll (About→…→Contact, mascot,
  footer all intact below). Wired in routes.tsx at the top of the `home` stack.
  GATED to desktop: `enabled = !reduced-motion && hasFinePointer && innerWidth>900`
  (the width check is the reliable one — headless/emulated pointer-media reports
  fine even on mobile); on mobile/reduced-motion renders null → the normal
  HomePage hero is the opener (no scroll-hijack on touch). TWO BUILD/TEST FIXES
  found here: (1) `gsap/ScrollTrigger` ships ESM → CRA Jest (doesn't transform
  node_modules) failed to parse it and BROKE THE WHOLE SUITE; fixed with a
  package.json `jest.transformIgnorePatterns` that keeps CRA's defaults (incl the
  CSS-module exception) but whitelists gsap for transform. (2) GSAP bundled into
  main.js (360→488K); fixed by `React.lazy(() => import(CinematicIntro))` +
  `<Suspense fallback={null}>` in routes.tsx → GSAP is its own chunk, main back
  to 372K. CDP-verified: desktop pin scrubs (card grows→pulls back→lifts) and
  releases to the sections+footer, 0 console errors; mobile/reduced-motion → no
  cinematic, 0 horizontal overflow at 360/390. All 4 gates green. Files:
  CinematicIntro.tsx (new), routes.tsx, App.css, package.json. NOT pushed.
- **2026-08-01 (cinematic reworked to a LAPTOP-opening + reload-to-top fix)** —
  Owner: headline should be "I am / Naseeruddin Shaik" (drop the tagline text);
  on scroll a LAPTOP opens and shows the hero on its SCREEN with a visible
  keyboard; then normal landing; AND reload must start at the top.
  • CinematicIntro reworked: headline is now `I am` + the name (silver gradient).
    The card became a 3D LAPTOP — `.cine-laptop__screen` is the lid
    (`transform-origin: bottom`, GSAP animates `rotationX` -90°→0° = closed→open),
    holding the hero (photo/name/tagline/summary/stats/CTAs) as the "screen"
    content that fades in as it opens; `.cine-laptop__base` is a `rotateX(62deg)`
    tilted deck with 60 keys + trackpad + hinge. Sequence: headline recedes →
    closed laptop rises → lid opens → screen powers on + content → hold → whole
    laptop lifts away → pin releases into the long-scroll. Same desktop-only gate.
  • RELOAD-TO-TOP fix (App.tsx): browsers default `history.scrollRestoration:
    'auto'` restored the last scroll on reload → you'd land mid-cinematic. Added
    a mount-once effect: `history.scrollRestoration = 'manual'` + `scrollTo(0,0)`.
    CDP-verified: scroll to 2952 → reload → scrollY 0.
  CDP-verified: headline text correct; lid transform goes matrix3d(-90°)→
  matrix(open); keyboard 60 keys; screen content visible on open; releases to
  About+footer; mobile/reduced-motion → no cinematic; 0 errors; 4 gates green,
  main 372K (GSAP still lazy-chunked). Files: CinematicIntro.tsx, App.css,
  App.tsx. NOT pushed.
- **2026-08-01 (laptop-open polish)** — Owner: the laptop didn't read as a real
  lid opening + dead space below. Reworked the ASSEMBLY: `.cine-laptop` is a
  flex column (lid stacked ON the deck, `justify-content:flex-end`) CENTERED in
  the stage with `margin-top:-5vh` so the open laptop stays vertically centred
  (killed the big empty band under the old low-anchored base). Lid + deck now
  share the hinge LINE (deck top edge = lid bottom edge; CDP: screenBottom ===
  baseTop ≈ 637). Lid closed state -92° (lying flat on the deck); GSAP opens it
  slowly (`rotationX -92→0`, duration 4 in the pinned tl) so it reads as a lid
  lifting, and the site content pops onto the screen in the tail of the open
  (positions 3.6–4.5). Deck tilt eased 62°→52°, compact height. CDP-verified:
  closed lid ~16px tall → opens to 538px, hinge connected, content reveals on
  the screen (photo/name/stats/CTAs), releases to the page; mobile/reduced-motion
  still gate off; 4 gates green, main 372K. Files: CinematicIntro.tsx, App.css.
  NOT pushed.
- **2026-08-01 (fix: landing cards had no scroll-reveal pop)** — Owner: cards on
  the landing page weren't animating in on scroll. Root cause: index.html's
  `reveal-fallback` safety net (a FIXED `setTimeout`) force-reveals ALL
  `[data-reveal]` with `opacity:1 !important; transform:none !important` if JS
  stalls — fine when Home was one short page, but now the landing opens with the
  ~2800px PINNED cinematic, so the visitor is still in the intro when the timer
  fires → it slapped `reveal-fallback` on the root and permanently killed every
  card's scroll-in animation (CDP: root had `reveal-fallback`, cards
  opacity:1/transform:none, static). Fix: the fallback is only for a FAILED JS
  boot, so index.html now stores its id on `window.__revealFallbackTimer` and
  App.tsx clearTimeout()s it on mount (React booted ⇒ JS works ⇒ net not needed);
  also bumped 4s→8s as a cushion. CDP-verified: reveal-fallback NOT on root after
  boot; a below-fold card is opacity:0/hidden before scroll, gets `is-in` +
  0.95s transition and climbs 0→1 when scrolled in; grid `--rd` stagger intact
  (0/0/70/140ms); reduced-motion still shows all cards (no regression, resilience
  net still fires if JS truly fails). 4 gates green. Files: public/index.html,
  App.tsx. NOT pushed.
- **2026-08-01 (holographic cert badges, landing only + reveal enhance)** — Owner
  gave a shadcn/Tailwind Product-Hunt "award-badge" sample (holographic foil +
  3D mouse-tilt) and wanted the cert tiles to LOOK like it, LANDING page only.
  The sample is literal PH branding + heavy per-card matrix JS + 10 animated SVG
  overlays — so adapted the LOOK, not the branding/weight: a `holoBadges` prop on
  SkillsPage (true only in the `#home-skills` stack via routes.tsx; standalone
  Skills page stays plain). Holo cards get `.cert-card--holo` + two decorative
  layers — `.cert-holo--foil` (a conic multi-hue gradient, blurred, mix-blend
  screen, 7s rotate = the iridescent sheen) and `.cert-holo--shine` (diagonal
  sweep on hover) — layered over the EXISTING `data-tilt` 3D lean (bumped 4→8 for
  holo), all plain CSS (no new dep, far lighter than the sample's per-frame
  matrix math). Reveal enhance: the cert grid now uses `data-reveal='scale'` so
  the tiles pop-scale in with the `--rd` stagger. Reduced-motion freezes the foil
  spin + shine (static sheen kept). CDP-verified: #home certs 7/7 holo + foil +
  scale-reveal; standalone #skills 0 holo (plain); mobile 7 holo, 0 h-overflow,
  cert titles readable (opacity>0.9, sheen doesn't obscure text). 4 gates green.
  Files: SkillsPage.tsx, routes.tsx, App.css. NOT pushed.
- **2026-08-01 (hero entrance after the laptop cinematic)** — Owner: after the
  laptop lifts away, the real hero (name + photo) just appeared FLAT while
  everything below animated. Added a hero entrance in CinematicIntro.tsx. Key
  gotchas solved: (1) `.hero-page` is a SIBLING of the cinematic root, so the
  hero logic must live OUTSIDE `gsap.context(..., root)` — context scopes
  selectors to root's descendants, so root-scoped `.hero-page` selectors matched
  NOTHING (that was why 3 earlier attempts read opacity 1). Now resolves real
  elements via `document.querySelector('.hero-page').querySelectorAll(...)`.
  (2) The pin-spacer is ~3700px tall and the hero scrolls INTO view (~3200px)
  WHILE still inside the pin range → the pin's onLeave/scrub tail fire too late.
  So: `gsap.set` arms the hero hidden (autoAlpha 0, y 60, blur), and a fresh
  IntersectionObserver plays a timed staggered entrance (autoAlpha/y/blur,
  expo.out) the first time the hero crosses in. CDP-verified: hero opacity 0 at
  top + at 3050px, climbs 0→0.39→0.83→1 as it enters ~3200px, settles 1. SAFETY:
  the whole effect is gated by `enabled` (desktop+motion) — on mobile/reduced-
  motion it returns null BEFORE gsap.set runs, so the hero is never hidden
  (CDP: opacity 1, cinematic absent). Cleanup disconnects the observer +
  clearProps the hero on unmount. 4 gates green. Files: CinematicIntro.tsx.
  NOT pushed.
- **2026-08-11 (iPhone-setup "hello" greeting above the role kicker)** — Owner:
  put the iPhone boot "hello / hola / bonjour…" greeting in the empty space above
  "SOFTWARE ENGINEER" on the landing cinematic — cursive script, cycling all
  languages with the iPhone cross-fade, themed to the site. New
  `components/effects/HelloGreeting.tsx`: one greeting at a time from a 21-entry
  world list (Latin + JP/CN/KR/HI/AR/RU/GR/HE/PA scripts), cross-fading every
  1600ms (fade-out 320ms → swap → fade-in via `.is-in` class); reduced-motion →
  static "hello". Rendered as a `.cine-line` above `.cine-kicker` in
  CinematicIntro (so it reveals + recedes-on-scroll with the headline). Apple's
  script font is proprietary → owner chose **Dancing Script** (added to the
  existing non-blocking Google Fonts link in index.html — both the `media=print`
  load and the noscript). Styled `.hello-greeting__word`: Dancing Script ~76px,
  accent→cyan→pink gradient text (site theme), drop-shadow, @supports fallback +
  reduced-motion static. CDP-verified: greeting present ABOVE the kicker,
  Dancing Script 76px gradient text, cycles hello→hola→bonjour→ciao→…→こんにちは;
  reduced-motion/mobile → cinematic (and greeting) absent, normal hero. 4 gates
  green, `Dancing+Script` confirmed in built index.html (ships in prod). Files:
  HelloGreeting.tsx (new), CinematicIntro.tsx, App.css, public/index.html. NOT
  pushed.
- **2026-08-11 (hello greeting reworked: writes-on, bigger, higher)** — Owner:
  the cross-fade didn't look iPhone-like + moved too fast + sat too low. Reworked
  HelloGreeting.tsx: each word now REVEALS left-to-right as if written by a pen —
  the handwriting-font text (Dancing Script) has a `clip-path: inset(0 100% 0 0)`
  that sweeps open to `inset(0 0 0 0)` (@keyframes hello-write, 1500ms), with a
  glowing pen-tip (`.hello-greeting__pen`) riding the leading edge (@keyframes
  hello-pen), then hold 1000ms + fade 550ms, next word writes. (First tried true
  SVG stroke-dashoffset draw with hand-authored letterform paths — owner-approved
  approach — but the hand-drawn cursive paths were illegible; the clip-reveal
  over a real handwriting font keeps legibility AND reads as "being written".)
  Latin greetings only (hello/hola/bonjour/ciao/olá/hallo/hej/ahoj/salut/ahoy).
  BIGGER: font-size clamp up to 6.5rem (~104px, was ~76). HIGHER: `.hello-
  greeting-line` is now `position:absolute; top:clamp(6vh,12vh,16vh)` inside
  `.cine-hero-text` (pulled out of the centred flow into the empty upper space).
  SLOWER: ~3s per word cycle. CDP-verified: word big (104px) + legible Dancing
  Script at topY~231, clip-path sweeps 99%→0% (writes L→R), cycles languages;
  recedes with `.cine-hero-text` on scroll (opacity 1→0 by 1500px, no lingering
  over the laptop); reduced-motion/mobile → cinematic+greeting absent, normal
  hero. tsc+eslint green (tests+build backgrounded, slow machine). Files:
  HelloGreeting.tsx, App.css. NOT pushed.
- **2026-08-11 (hello greeting: native scripts + REAL stroke-draw + no overflow)**
  — Owner: greetings must be in NATIVE scripts (नमस्ते Devanagari, నమస్కారం
  Telugu…), the clip-reveal only SLID the word (not writing), and text
  overflowed the box. Reworked HelloGreeting.tsx to the genuine iPhone technique:
  each greeting is an SVG `<text>` whose GLYPH OUTLINES are stroked
  (`.hello-greeting__stroke` fill:none stroke:url(#hello-grad)), and
  `stroke-dashoffset` animates 1600→0 (@keyframes hello-draw) so the letters
  TRACE themselves on like a pen — works for ANY script because it strokes the
  real font glyphs; a fill fades in behind (@keyframes hello-fill) so the held
  word reads solid. Curated native-script set with per-word font-family so
  complex scripts pick correct glyphs: Latin=Dancing Script; नमस्ते=Noto/Nirmala
  Devanagari; నమస్కారం=Noto/Nirmala Telugu; 你好/こんにちは=CJK; 안녕하세요=KR;
  مرحبا=Arabic (system-font fallbacks, verified rendering on Windows). OVERFLOW
  FIX: `.hello-greeting__svg` is a fixed box (width min(46vw,460px), viewBox
  600x180, overflow:hidden, preserveAspectRatio meet) so even the long Telugu
  word (textW 403/460) stays inside. CDP-verified: dashoffset draws 1600→0
  (real trace, not slide); नमस्ते + నమస్కారం render as CORRECT native glyphs (not
  tofu — screenshots confirm), fitsBox:true for all incl Telugu/Arabic; still up
  top + big; reduced-motion/mobile → absent. All 4 gates green. Files:
  HelloGreeting.tsx, App.css. NOT pushed.
- **2026-08-11 (laptop pin faster + scroll-driven hero reveal)** — Owner: the
  laptop took too long to scroll through, and after it the hero info loaded
  slowly (fixed timer) instead of tracking scroll speed. CinematicIntro.tsx:
  (1) pin `end` 2800→1650, `scrub` 1→0.5, dead hold 2→1 → pin-spacer 3700→2550px
  (~31% less scroll, less lag). (2) Hero reveal was a fixed
  `gsap.to(heroEls,{duration:1.1})` fired by an IntersectionObserver — replaced
  with a SCRUBBED ScrollTrigger (scrub 0.5) so it fills ACCORDING TO SCROLL
  POSITION: fast scroll → info snaps in fast, slow → eases in. KEY GOTCHA: can't
  trigger off the hero's position (during the pin its on-screen position is
  distorted and snaps up at release → a position band gets consumed in one
  frame). So the pin timeline got `id:'cine-pin'` and the hero trigger uses
  FUNCTION start/end anchored to absolute scroll px around the pin's end
  (`pin.end-550 … pin.end+120`, invalidateOnRefresh). CDP-verified: pin-spacer
  2550px; fast-scroll to 2300 → hero opacity 1 within 0.7s; slow-scroll shows a
  0→1 gradient across the band; laptop still opens correctly; mobile/reduced-
  motion → hero visible (opacity 1), not hidden; 0 console errors. tsc+eslint
  green (tests+build backgrounded). Files: CinematicIntro.tsx. NOT pushed.
- **2026-08-12 (RGB glowing laptop keyboard)** — Owner: make the laptop keyboard
  an RGB keyboard glowing in a neon pattern. Each of the 60 `.cine-key`s now gets
  a `--k` = (col + row) inline (CinematicIntro.tsx keyboard map, 15-col grid), and
  `.cine-key` (App.css) has a vivid hsl neon face + colored box-shadow glow and a
  `@keyframes cine-key-rgb` `filter: hue-rotate(0→360)` 4s loop; per-key
  `animation-delay: calc(var(--k) * -0.22s)` offsets the hue so the neon colour
  sweeps DIAGONALLY across the board (rainbow-wave like a gaming keyboard).
  Reduced-motion holds a static neon colour. CDP-verified: 60 keys animating
  cine-key-rgb; two frames 0.8s apart show the full spectrum ROLLED across the
  board (wave moving); screenshots show orange→…→red neon glow. tsc+eslint green
  (tests+build backgrounded). Files: CinematicIntro.tsx, App.css. NOT pushed.
- **2026-08-13 (hero reveal timing + brighter keys)** — Owner: after the laptop
  the hero image/text gave no animation, and the RGB keys were too dark. (1) HERO
  REVEAL: the scrubbed reveal was anchored to absolute px around `pin.end`, so it
  COMPLETED while the laptop was still lifting away — you never saw it. Root cause
  confirmed via CDP: hero finished (opacity 1) at sy~2520, but the hero doesn't
  reach a viewable spot until sy~2600+. The old "laptop distorts hero position
  during pin" worry no longer applies — CDP shows the laptop is `opacity:0` and
  scrolled ~1700px off-screen well BEFORE the hero enters. So the reveal now uses
  a normal element-based trigger on `.hero-page` (`start:'top 92%'`,`end:'top
  42%'`, scrub 0.5) — blur→rise plays out IN VIEW, paced to scroll. CDP-verified:
  title fades over heroTop 896→598, photo staggers over 598→397; mid-scroll
  screenshot shows the portrait still blurred/translucent while the title is in.
  (2) BRIGHTER KEYS: `.cine-key` HSL lightness 62/42% → 75/58% and glow alphas
  0.75/0.4 → 0.9/0.55 (App.css). Screenshot confirms bright lit spectrum, no
  longer dark. tsc+eslint green (tests+build backgrounded). Files:
  CinematicIntro.tsx, App.css. NOT pushed.
- **2026-08-13 (edge-lit keys)** — Owner: still felt dark; light the key BORDERS,
  not the whole face, so it reads lighter. `.cine-key` (App.css) now has a DARK
  key body (`#14161d→#0c0d12` gradient, was a solid neon face) with a glowing neon
  `border: 1.5px solid hsl(300 100% 68%)` + inset/outer glow — hue-rotate spins
  the ring/glow through the spectrum, so the wave flows around the EDGES not the
  fill (like real per-key RGB backlighting). CDP-verified: 60 keys, border color
  neon (rgb 255,92,255) over transparent-ish dark bg; two frames 0.9s apart show
  the rim colours shifted (wave still moving). tsc+eslint green (tests+build
  backgrounded). Files: App.css only. NOT pushed.
- **2026-08-19 (trim dead scroll below the laptop)** — Owner: too much empty gap
  below the laptop before the hero arrives. CDP showed the laptop was fully faded
  (`.cine-laptop` opacity 0) by sy≈1867 but the pin held to 2550 — a ~680px dead
  band. Fix in CinematicIntro.tsx: pin `end:'+=1650'→'+=1200'` (pin-spacer 2550→
  2100), trailing hold `.to({},{duration:1})→0.4`, and collapsed the two-stage
  lift-away (`-16vh` 1.1 + `-135vh` 1.2 = ~2s of dead scroll travelling
  off-screen) into ONE `y:'-70vh' autoAlpha:0` 1.2 exit (it fades as it goes, so
  it needn't travel a full screen-and-a-third). CDP-verified: laptop now clears at
  sy≈1447 (was 1867) with the hero already rising right behind it (heroTop 933 and
  climbing), pin releases 450px sooner; screenshot at sy1500 shows the hero
  entering the viewport, no long void. Hero reveal still element-anchored to
  `.hero-page` so it re-measures and plays in view regardless of the shorter pin.
  tsc+eslint green (tests+build backgrounded). Files: CinematicIntro.tsx. NOT
  pushed.
- **2026-08-19 (name "jumps out of the screen")** — Owner: before the laptop, the
  "Naseeruddin Shaik" name just disappeared; make it POP toward the viewer like
  it's coming out of the screen, THEN the laptop comes. Replaced the old single
  `.to('.cine-hero-text',{scale:1.08,autoAlpha:0,blur})` exit (a flat dissolve)
  with a per-element sequence at the head of the pin timeline (CinematicIntro.tsx):
  `.cine-headline` gets an anticipation dip (`scale:0.9`, 0.28) then a lunge toward
  the camera (`scale:2.4, y:-70, autoAlpha:0, blur(10px)`, power3.in, 0.85); the
  rest (greeting/kicker/scroll-cue) fade back separately; the laptop rise-in was
  pushed to +0.55 so it follows the pop. Added `will-change` to `.cine-headline`
  (App.css). `.cinematic-intro` already has `perspective:1600px` + `overflow:hidden`
  so the giant name flies past the edges (reinforces "out of the screen"). CDP-
  verified: name lifts 0→-70 while opacity 1→0 and the laptop rises 0→1 behind it;
  lunge screenshot shows the enlarged name spanning the viewport as the RGB
  keyboard enters. tsc+eslint green (tests+build backgrounded). Files:
  CinematicIntro.tsx, App.css. NOT pushed.
- **2026-08-19 (constellation cursor mesh bg)** — Owner supplied a shadcn/Tailwind/
  Next "ConstellationGrid" sample; wanted it as the interactive background of the
  laptop/scroll area. Adapted to THIS stack (new
  components/effects/ConstellationGrid.tsx): dropped `'use client'`, the Tailwind
  wrapper, title overlay and dark-mode media query; kept the physics engine
  (Hooke's-law spring grid, cursor-speed shockwave repulsion, distance-culled
  connections, proximity accent highlight + radar rings + hex readout). Key
  adaptations: canvas is `alpha:true` + `clearRect` (transparent) so it LAYERS
  over the cinematic bg/aurora instead of painting black; sized to its PARENT
  (`.cinematic-intro`, 100vh) via `host.getBoundingClientRect()` not the window;
  cursor tracked in the host's LOCAL space and ignored when outside the intro
  rect; colours read from `--text`/`--accent` tokens (hex→"r,g,b"); reduced-motion
  → renders nothing; `ctx.setTransform` (not `ctx.scale`, which compounds per
  resize). It REPLACES the old static `.cinematic-intro__grid` div at z-0 (behind
  headline z-10 / laptop z-20); pointer-events stay ON to drive shockwaves; a
  radial mask feathers the mesh edges. CDP-verified: canvas mounts 1377x900,
  draws (2800 alpha px), a fast CDP cursor sweep visibly scatters the node grid
  (shockwave) with radar ring + hex "93:42" readout, calm grid elsewhere; text
  overlays sit cleanly on top. tsc+eslint green (tests+build backgrounded). Files:
  ConstellationGrid.tsx (new), CinematicIntro.tsx, App.css. NOT pushed.
- **2026-08-19 (floating-paths line-work bg)** — Owner supplied a second
  shadcn/Tailwind/Next + framer sample ("BackgroundPaths"); wanted the MOVING
  curved lines added to the same scroll area as an ADDITIONAL layer (nothing
  removed). New components/effects/FloatingPaths.tsx: kept only the FloatingPaths
  SVG (2 mirrored 36-path fans, position ±1); dropped 'use client', Tailwind
  wrapper, title/letter animation, shadcn Button, and the 3 new deps (framer
  already present; radix-slot/cva only served the Button). GOTCHA: the sample
  animates the lines with framer `motion.path` pathLength/pathOffset — but our
  `<LazyMotion features={domAnimation}>` does NOT include the SVG path-drawing
  feature, so `m.path` renders STATIC (CDP-confirmed: pathLength=1, dasharray
  "1 1", dashoffset "0" unchanged across 3 frames, no error). Switched to plain
  CSS: `pathLength={1}` normalises each path to 1 unit, `stroke-dasharray:.4 .6`,
  `@keyframes floating-paths-drift { stroke-dashoffset 1→0 }`, per-line
  `--fp-dur` (20–35s) + `--fp-dir` (mirrored fan runs reverse). Native, zero
  bundle cost. Layer: `.floating-paths` z-0 (DEEPEST), constellation bumped to
  z-1, headline z-10, laptop z-20; `color:var(--accent)`→currentColor strokes,
  opacity .5, radial edge mask, pointer-events:none, reduced-motion display:none.
  `preserveAspectRatio="none"` stretches the fans to fill. CDP-verified: 72 paths,
  dashoffset animates (.868→.847→.824 across frames), screenshot shows the accent
  curved line-work drifting under the constellation with the headline clean on
  top; no strict-mode errors. tsc+eslint green (tests+build backgrounded). Files:
  FloatingPaths.tsx (new), CinematicIntro.tsx, App.css. NOT pushed.
- **2026-08-19 (perf pass — smooth on all devices, NOTHING removed)** — Owner: site
  feels heavy, make it smooth + render without a GPU, keep every component. CDP
  profiled FIRST: 179 concurrent CSS animations at idle, idle FPS 31; a Chrome
  trace showed the cost is spread across many small animations (UpdateLayoutTree
  ~293ms/2.5s) + the constellation rAF, NOT one villain, and it all ran even when
  the intro was scrolled OFF-screen. Fixes (all keep the components, just lighter):
  (1) BIGGEST WIN — intro visibility gate: IntersectionObserver on `.cinematic-
  intro` (200px rootMargin) toggles `is-offscreen`; CSS `.is-offscreen *
  {animation-play-state:paused!important}` freezes all 132 intro animations (72→
  now 36 paths + 60 keys) and the constellation's rAF halts via a new `active`
  prop (effect dep). Result: scrolled-past FPS 31→64, 0 intro animations running;
  About/Skills/deep-page all 57–64 (was 31). (2) FloatingPaths 72→36 lines (18/
  fan, `i*2` keeps the spread) — animated SVG stroke-dashoffset isn't GPU-
  composited so each line re-renders/frame. (3) `.cine-key` dropped
  `will-change:filter` (was force-promoting 60 GPU layers = heavy VRAM on iGPUs).
  (4) Constellation connection pass O(n²)→O(n): scan only ±2 grid-neighbours
  (index=col*rows+row) instead of all pairs (~118k→few k checks; pixel-identical,
  screenshot-verified). (5) New lib/env `isLowPowerDevice()` (cores<=4 || mem<=4);
  constellation uses it → spacing 55→90 + DPR cap 2→1 on weak hardware (fewer
  nodes/lines/pixels). Top-of-page still ~40 FPS (inherently heaviest — 3 bg
  systems stacked there); everything else buttery. All layers visually intact
  (constellation mesh, drifting paths, greeting, name, mascot, ticker). Reduced-
  motion still fully disables the heavy bits. tsc+eslint green (tests+build
  backgrounded). Files: ConstellationGrid.tsx, FloatingPaths.tsx, CinematicIntro.
  tsx, lib/env.ts, App.css. NOT pushed.
- **2026-08-19 (mobile hero entrance — less plain)** — Owner: mobile looks very
  plain (all the cool stuff is desktop-gated). CDP inventory: mobile already runs
  38 anims (aurora, ticker, hero-word letters, portrait shine/scan, 53
  data-reveal) and the base `.is-ready [data-reveal]` reveal ALREADY rises 44px +
  unblurs — BUT the hero's above-fold cluster (pill/tagline/summary/intro/CTA) all
  had `--rd`=0, so they revealed SIMULTANEOUSLY on load (movement happens but all
  at once in <1s → reads as "just appeared"). Root-cause fix was just STAGGER, not
  a new animation: added inline `--rd` (80/520/640/740/860ms) to those 5 hero
  elements in HomePage.tsx so they CASCADE in one after another (badge → [name
  letters via existing hero-word --i] → tagline → summary → intro → CTAs). Reuses
  the existing reveal system, zero new CSS keyframes/JS, GPU-cheap, reduced-motion
  still flattens it, also improves the desktop hero reveal. (An interim
  `.reveal-rise` App.css modifier was added then REMOVED once CDP showed the base
  reveal already rises — net App.css change is nil; only HomePage.tsx changed.)
  CDP-verified on 390x844: pill fades+rises 0/44→1/0 over ~600ms while lead/summary
  hold at 0/44 until their delay, then follow — true sequential cascade. No
  H-overflow, 0 errors (earlier mobile audit: iPhone SE/14/Pixel/iPad all clean).
  tsc+eslint green (tests+build backgrounded). Files: HomePage.tsx. NOT pushed.
- **2026-08-20 (footer cursor ribbon-trails)** — Owner supplied a shadcn/Tailwind/
  Next `renderCanvas` sample (springy neon ribbon-trails chasing the cursor);
  wanted it as the footer background BEHIND the robot, both reacting to the same
  cursor, nothing removed. New components/layout/FooterRibbons.tsx: kept the
  physics (multi-node spring "lines" trailing the pointer, additive `lighter`
  blend, quadratic-curve draw) but REWROTE the sample's module-global +
  `@ts-ignore` + `getElementById("canvas")` + window-sized mess as a
  self-contained component — all state in the effect, canvas sized to its PARENT
  (the footer) via host rect, cursor read in the footer's LOCAL space (only
  tracks while pointer is over the footer), DPR-capped, `setTransform`. Themed:
  hue oscillates ±40° around `--accent`'s hue (not the sample's rainbow). Dropped
  the Hero/Button/dicons/next deps. Gated: desktop + fine-pointer only,
  reduced-motion → null, rAF pauses when footer off-screen (new
  IntersectionObserver in Footer.tsx → `active` prop). Layer: `.footer-ribbons`
  z-0 DOM-first (paints UNDER `.footer-robot` z-0), pointer-events:none + radial
  edge mask; robot (z-0) / orbit (z-1) / credit (z-2) all untouched. CDP-verified:
  canvas mounts 1425x460, a cursor sweep paints a glowing accent trail flowing to
  the cursor (screenshot), robot STILL parallax-tracks (translateX -18→+17,
  rotateY sign flips L/R), orbit+credit intact, 0 errors. Only the landing footer
  gets it (normal footer unchanged). tsc+eslint green (tests+build backgrounded).
  Files: FooterRibbons.tsx (new), Footer.tsx, App.css. NOT pushed.
- **2026-08-20 (magnetize particles on nav tabs)** — Owner supplied a shadcn/
  Tailwind/Next `MagnetizeButton` sample; wanted the magnet-particle hover on the
  nav tabs (Home/About/Skills/Projects/Contact). New components/effects/
  MagnetizeParticles.tsx: kept ONLY the particle behaviour (N accent dots
  scattered at rest → sucked to centre on hover via `useAnimation` spring →
  scatter back on leave); dropped the shadcn Button, lucide Magnet icon, "Hover
  me" label, violet Tailwind classes, and the 4 new deps (framer already here).
  Uses `m.span` (NOT motion.* — LazyMotion strict). It's a pointer-events:none
  overlay rendered INSIDE each existing `.nav-link` (Navbar.tsx: added per-item
  `hovered` state via onMouseEnter/Leave/Focus/Blur; wrapped label in
  `.nav-link__label`; class `nav-link--magnetize`). CSS (App.css): particle layer
  centred on the tab (`top/left:50%`), dots 5px accent + glow, `overflow:visible`
  so they scatter past the tab, label z-1 above. Spread 54px, 10 dots/tab.
  CDP-verified: 5 tabs × 10 = 50 dots, avg dist from centre 44px REST → 1px HOVER
  → 44px LEAVE (magnet cycle works), 0 errors, nav click/active-underline/mobile
  dropdown all intact. Reduced-motion → renders nothing. tsc+eslint green (tests+
  build backgrounded). Files: MagnetizeParticles.tsx (new), Navbar.tsx, App.css.
  NOT pushed.
- **2026-08-23 (architecture audit + Phase 0 refactors)** — Ran a 39-agent
  adversarially-verified audit (workflow) reverse-engineering the whole app; full
  report at scratchpad/audit.md. Top verified findings: 3550-line global App.css
  (465 selectors, no scoping) [CRITICAL scalability]; 1071-line useCompanionBehavior
  god-hook [HIGH]; useTilt rect-read-per-frame thrash [HIGH]; SocialBar/SocialOrbit
  byte-identical label+icon dicts [HIGH dup]; useCompanionIdlePool load-bearing
  memoization [HIGH]. The audit's adversarial pass CAUGHT several proposed fixes
  that would change behavior and flagged them UNSAFE (do NOT apply): `--companion-size`
  CSS var (JS-set, not breakpoint-scoped), scrollHeight caching (Home height
  changes w/o resize), lineWidth hoist in useCursorFx (toggles 0.6/0.7),
  FooterRobot rect-cache (host is spring-animated), "free" App.css file-move
  (equal-specificity source-order flips), Navbar 768 (Bootstrap token not mascot's).
  APPLIED Phase 0 only (pure refactors, zero behavior change, all CDP-verified):
  (1) useTilt caches rect on pointerenter (mirrors useMagnetic) — kills per-frame
  layout thrash; CDP: --tx/--ty still compute on hover. (2) useScrollProgress
  caches `.main-navbar` querySelector once (left scrollHeight per-frame). (3)
  useCursorFx pair-link loop: squared-distance guard, sqrt only inside branch
  (did NOT hoist lineWidth); CDP: cursor canvas still draws. (4) deleted dead
  strideRef across useCompanionBehavior/App.tsx/CompanionCharacter (+ its lying
  "written every frame" comments; --stride-phase CSS var was used nowhere). (5)
  deleted reportWebVitals (dead — called with no cb) + reportWebVitals.ts +
  web-vitals dep. (6) fixed stale COMPANION_IDLE_SUBS comment (shuffle bag not
  uniform), added SCAN_ROUTES to the routes.tsx add-a-route checklist. (7)
  FooterRobot 767 literal → COMPANION_MOBILE_BREAKPOINT. Gates: tsc+eslint+tests
  2/2+build all green. NOT DONE (Phase 1/2, needs owner go-ahead): social icon
  shared module, canRunHeavyDesktopFx helper, hex→token, god-hook split,
  App.css split. Files: useTilt.ts, useScrollProgress.ts, useCursorFx.ts,
  useCompanionBehavior.ts, App.tsx, CompanionCharacter.tsx, index.tsx,
  package.json, constants.ts, routes.tsx, FooterRobot.tsx, reportWebVitals.ts
  (deleted). NOT pushed.
- **2026-08-24 (perf audit + Phase A/B optimizations)** — Ran a 39-agent
  adversarially-verified PERF audit (workflow; synth agent hit session limit so
  the report was hand-synthesized from the journal → scratchpad/perf-audit.md).
  Measured baseline first (CDP): Home idle ~40 FPS; LEAK = over 15 route navs JS
  heap 21.8→28.6MB (+31%) + running animations 138→149 (DOM stable → JS-side).
  Adversarial pass KILLED false leads ("5 pages mount twice" — App renders one
  route; "CinematicIntro GSAP timeline leaks" — GSAP 3.15 .kill() removes it) and
  flagged UNSAFE fixes (RGB-key restructure, floating-paths transform swap,
  particle-count cut, IntersectionObserver on the fixed particle canvas — all
  change visuals; excluded). APPLIED Phase A (7 pure perf refactors, zero visual
  change, all CDP-verified) + Phase B (2 bundle gates):
  A1 useScrollReveal: animateCount now threads a `live` Set of rAF ids, cancelled
     in setupReveal cleanup — ROOT CAUSE of the leak (orphaned self-rescheduling
     count-up on mid-count route change).
  A2 FooterRibbons: cache host w/h on resize, drop per-frame getBoundingClientRect
     in render() (kept onMove's — reads scroll-dependent left/top).
  A3 ConstellationGrid: edge pass sets strokeStyle once + varies globalAlpha (no
     rgba string per edge); ctx.font hoisted out of the node loop. Pixel-identical.
  A4 CompanionCharacter perch rAF: skip node.style.transform write when unchanged.
  A5 React.memo(MagnetizeParticles) — nav hover no longer re-renders all 50 dots.
  A6 dropped stale will-change on .aurora + .hero-ticker__inner (their running
     transforms already promote the layer; left .footer-robot's).
  A7 useCompanionCursorEncounter: ref-wrap state/isIdleNow/requestWalk → effect
     deps [enabled,x,y], stops per-dispatch/per-render listener re-subscription.
  B1 routes.tsx: gate the CinematicIntro RENDER behind `wantsCinematic`
     (desktop+fine+motion+>900, module-load const) so React.lazy never fetches the
     ~2MB GSAP chunk for mobile/reduced-motion. CDP: fresh mobile Home loads ZERO
     chunks, no .cinematic-intro. (Behavior identical — those users saw null before.)
  B2 FooterRobot: new `inView` prop + `seen` latch; Footer passes footerInView (its
     existing IO, 150px rootMargin). ~4MB Spline WebGL now loads on footer-reach,
     not Home mount; latch prevents GL churn on scroll in/out. CDP: robot absent
     before footer scroll, present after.
  RESULT (CDP): LEAK FIXED — 15 navs heap 13.8→13.5MB (flat), animations 138→138
  (no accumulation). tilt/constellation/ribbons/robot/magnetize all verified
  visually identical; 0 errors desktop+mobile; no H-overflow. Gates: tsc+eslint+
  tests 2/2+build green. NOT DONE (Phase C, needs go-ahead): particle spatial-hash,
  FSM walk-gating, CompanionContext handoff→MotionValue. Files: useScrollReveal.ts,
  FooterRibbons.tsx, ConstellationGrid.tsx, CompanionCharacter.tsx,
  MagnetizeParticles.tsx, App.css, useCompanionCursorEncounter.ts, routes.tsx,
  FooterRobot.tsx, Footer.tsx. NOT pushed.
- **2026-08-24 (clean-architecture — SAFE structural moves)** — Owner asked for a
  clean-architecture rebuild (separate concerns, reduce coupling, scale). Rather
  than re-run the (already-done) architecture audit, applied its verified SAFE
  subset and documented the risky rest as plan. APPLIED (behavior-identical, CDP-
  verified): (1) `lib/env.canRunHeavyDesktopFx(minWidth=900)` — centralises the
  `!reducedMotion && finePointer && innerWidth>minWidth` composite that was
  hand-written in CinematicIntro, FooterRibbons, and routes.tsx's wantsCinematic;
  all three now call it (boolean-identical; FooterRobot keeps its own <=BREAKPOINT
  + Save-Data check). (2) New `components/layout/socialIcons.tsx` — shared
  SOCIAL_LABELS + SOCIAL_ICONS (the byte-identical dicts SocialBar & SocialOrbit
  each carried); both now import it; SocialOrbit keeps its orbit-only BADGE_ICONS/
  DECORATIVE. CDP-verified: SocialBar 4 glyphs render, SocialOrbit 18 elements,
  cinematic+ribbons still gate correctly, 0 errors. DELIBERATELY SKIPPED (ponytail
  — superficial rhyme, not real dup): shared canvas-util and color-parser
  (ConstellationGrid vs FooterRibbons differ — clamps, and rgb-triplet vs hue
  outputs; forcing one module = indirection for ~5 lines, risks pixel-identical).
  DOCUMENTED-BUT-DEFERRED (behavior-risky, no test net — need explicit go-ahead):
  split useCompanionBehavior into hooks/interactions/companion/ (Math.random
  order + effect deps + load-bearing memo), split App.css per-feature (equal-
  specificity source-order flips). Gates: tsc+eslint+tests+build green. Files:
  lib/env.ts, socialIcons.tsx (new), SocialBar.tsx, SocialOrbit.tsx,
  CinematicIntro.tsx, FooterRibbons.tsx, routes.tsx. NOT pushed.
- **2026-08-24 (nav buttons → neon outline pills)** — Owner: give the nav buttons
  (Home/About/Skills/Projects/Contact) good styling; chose "neon outline pills".
  Restyled `.main-navbar__links .nav-link` (App.css) from minimal text+growing-
  underline into rounded chips: 1px border-strong outline always on, radius 999px,
  faint translucent fill; hover → accent border + neon box-shadow glow + 1px lift;
  active → bright accent ring + inner glow + `--gradient` clipped text on
  `.nav-link__label`. Repurposed the old `::after` underline as an inset radial
  glow layer (z-index -1, isolate); deleted the stale `::after{width:100%}` rule;
  bumped `.main-navbar__links` gap 0.25→0.5rem. Magnetize particles + label
  z-layering preserved. CDP-verified: 5 pills, active border rgb(139,123,255)
  radius 999px, screenshots show active gradient-text pill + hover glow + idle
  outlines + particles converging, app mounts, 0 errors. Gates: tsc+eslint+tests+
  build green. Files: App.css only. NOT pushed.
- **2026-08-25 (mobile "cooler" — 4 touch-friendly features)** — Owner: mobile
  looks plain vs desktop (all the cursor effects are desktop-gated); add cool
  features that work on touch. Added 4 (none need a cursor; all perf-gated):
  (1) MobileAmbient.tsx (new) — a cursor-FREE constellation mesh as the mobile bg
  (mounted in BackgroundFx). Sparse self-drifting nodes (sine paths, no O(n²)
  shockwave), near-neighbour links via globalAlpha, node count scaled to area
  (sparser on isLowPowerDevice), DPR-capped, visibilitychange-paused. A TAP fires
  an expanding ripple that pushes nearby nodes (touch equiv of desktop cursor).
  Gates: null on desktop (finePointer+>900) / reduced-motion. CSS `.mobile-ambient`
  fixed z-3. (2) Mobile FloatingPaths — mounted the existing (pure-CSS, no-cursor)
  FloatingPaths in BackgroundFx behind a `.mobile-paths` fixed wrapper, gated by
  isMobileViewport() (!finePointer || <=900). (3) Tap/press micro-interactions —
  App.css `@media (hover:none) and (pointer:coarse)`: cards/links/buttons/nav
  scale-down + accent-glow on `:active` (spring ease); data-tilt cards use
  `perspective(1100px) scale(.97)!important` to beat their base transform; a
  reduced-motion sub-block drops the scale. (4) useDeviceTilt.ts (new, wired into
  useInteractions) — reads gyroscope (DeviceOrientationEvent), maps gamma/(beta-45)
  over ±30° to `--tilt-x/--tilt-y` (-1..1), rAF-throttled; iOS 13+ permission
  requested on first touchend; the `.aurora` transform now adds `--tilt-x/y * 26px`
  so bg layers drift as you tilt (0 on desktop → reduces to scroll-only). CDP-
  verified: ambient canvas draws + tap ripple visible (screenshot), paths dash
  animates, mapping math correct (gamma20/beta65→0.667/0.667; neutral 0,0), aurora
  responds to tilt var (-26px), FRESH desktop context shows NO mobile layers +
  cinematic intact, no H-overflow, 0 errors. CAVEAT: tap-press `:active` and the
  gyroscope can't be fully exercised in headless Chrome (CDP doesn't map touch→
  :active pseudo, no real sensor) — both use the standard native mechanisms that
  work on real iOS/Android; every verifiable sub-part checks out. Gates: tsc+
  eslint+tests 2/2+build green. Files: MobileAmbient.tsx (new), useDeviceTilt.ts
  (new), BackgroundFx.tsx, useInteractions.ts, App.css. NOT pushed.
- **2026-08-25 (footer gradient bg + corner cat)** — Owner: empty space either
  side of the footer robot; add an animated gradient bg + a cat sitting in the
  right corner looking up. (1) AnimatedGradientBackground.tsx (new) — adapted a
  shadcn/Tailwind/Next sample: kept the rAF "breathing" (radius eases ±range each
  frame, writes `background` on a ref), dropped Tailwind + the Lottie demo dep,
  motion→m, palette = SITE theme (transparent→violet→cyan→pink, anchored
  `at 50% 100%` so it glows UP from the footer bottom + fills the sides).
  Reduced-motion → static gradient (no rAF). Mounted as the DEEPEST landing-footer
  layer (z-0, DOM-first, under ribbons/robot). (2) FooterCat.tsx (new) — an <img>
  in the bottom-right, z-1, pointer-events:none, gentle idle float (footer-cat-
  float, off on reduced-motion), theme drop-shadow glow; onError hides it if the
  asset is missing. Owner will supply the real art — a PLACEHOLDER sitting-cat-
  looking-up SVG ships at public/assets/footer-cat.svg; replace that file (keep
  name) or repoint CAT_SRC. CSS: `.animated-gradient-bg(__layer)`, `.footer-cat(__img)`
  + mobile size tweak. CDP-verified: gradient breathing (radius 126%→ changing),
  cat loaded (naturalWidth>0) at 55px from right edge / footer bottom, robot+orbit
  intact, 0 errors. Gates: tsc+eslint+tests 2/2+build green. Files:
  AnimatedGradientBackground.tsx (new), FooterCat.tsx (new), Footer.tsx, App.css,
  public/assets/footer-cat.svg (new placeholder). NOT pushed.
- **2026-08-25 (footer cat — pink, from behind, animated tail+ears)** — Owner gave
  5 reference frames of a PINK cat sitting from BEHIND (white belly stripe, pointed
  ears, curling tail that swishes). Rebuilt FooterCat.tsx from an <img>+placeholder
  into INLINE SVG so CSS can animate the tail + ears as their own groups. Body =
  pink gradient pear shape from behind, white centre stripe, 2 ears, small
  turned-head detail, tail curling to the right. Animations (App.css): `.cat-tail`
  swishes (rotate -4→9deg, transform-box:fill-box origin at base, 3.2s);
  `.cat-ear--l/--r` twitch on offset 5s cycles; reduced-motion holds all still.
  `.footer-cat__svg` overflow:visible so the tail swings past the box. Deleted the
  old public/assets/footer-cat.svg placeholder (cat is inline now). CDP-verified:
  svg + tail present, tail transform CHANGES across frames (swishing), cat at right
  edge/footer bottom, NO overlap with orbit or credit, 0 errors; screenshot shows
  the pink from-behind cat in the corner next to the mascot over the gradient.
  Gates: tsc+eslint+tests 2/2+build green. Files: FooterCat.tsx, App.css;
  deleted public/assets/footer-cat.svg. NOT pushed.
- **2026-08-25 (cat corrected from reference VIDEO + corner rainbow)** — Owner gave
  IMG_6786.MP4 (a 21st.dev AnimatedGradientBackground preview) and wanted: the
  gradient NOT full-footer but a small RAINBOW behind the cat in the bottom-RIGHT
  corner only, cat ON TOP looking up, tail wagging like the video. Read the video
  via ffmpeg (WinGet Gyan.FFmpeg) — extracted + cropped frames: pink cat from
  behind, white belly stripe + tuft, 2 ears, head turned up, long tail that WAGS
  between a down-sweep and an up-curl; gradient = dark core→blue→orange arc rising
  from bottom. Changes: (1) removed the full-footer AnimatedGradientBackground
  from Footer.tsx and DELETED the component + its CSS (unused). (2) FooterCat.tsx:
  added `.footer-cat__rainbow` span — a corner-scoped radial gradient (blue→orange
  →pink, `circle at 50% 100%`, masked, breathing) behind the cat; reshaped the SVG
  cat to match the video (slimmer sit, up-turned head, stripe+tuft). (3) tail-wag
  animation upgraded to rotate -8→16deg + scale (reads as the furl/unfurl), 2.4s;
  ears still twitch; reduced-motion stops all incl. rainbow. CDP-verified: cat +
  rainbow present, full-footer gradient GONE, tail wagging (transform changes),
  NO overlap with orbit/credit, 0 errors; screenshot shows the pink cat on the
  blue→orange corner glow. Gates green. NOTE: ffmpeg frames in scratch/catframes.
  Files: FooterCat.tsx, Footer.tsx, App.css; deleted AnimatedGradientBackground.tsx.
  NOT pushed.
- **2026-08-25 (footer: U-glow, cat removed)** — Owner: remove the cat (not up to
  the mark); change the corner gradient to a U-shaped curve spread across the
  WHOLE footer bottom, breathing. Deleted FooterCat.tsx + all its CSS. New
  FooterGlow.tsx: a `.footer-glow__layer` whose JS rAF paints
  `radial-gradient(W% H% at 50% 118%, blue→orange→pink→transparent)` — a WIDE
  (~84-96%) + SHORT (~57-67%) ellipse anchored below the footer bottom-centre, so
  the coloured band arcs up at the L/R edges and dips centre = a U across the full
  width; the JS breathes W/H via sin (reduced-motion → static U). z-0 deepest
  layer (under ribbons/robot), 8px blur, click-through. Wired into Footer.tsx
  landing variant. CDP-verified: glow present + breathing (radius 84%→ changing),
  cat GONE, screenshot shows orange-centre→violet-sides U across the whole footer
  floor, 0 errors. Gates green. Files: FooterGlow.tsx (new), Footer.tsx, App.css;
  deleted FooterCat.tsx. NOT pushed.
- **2026-08-25 (more greeting languages)** — Owner: add more languages to the top
  HelloGreeting cycle. Expanded 11 → 23 greetings (HelloGreeting.tsx). Added: German/
  Dutch hallo, Turkish merhaba, Vietnamese xin chào (Latin/handwriting); Tamil
  வணக்கம், Kannada ನಮಸ್ಕಾರ, Malayalam നമസ്കാരം, Bengali নমস্কার, Gujarati નમસ્તે
  (new Indic font consts — all fall back to 'Nirmala UI' which is bundled on
  Windows); Russian Привет, Greek Γεια, Thai สวัสดี, Hebrew שלום (new consts, Segoe
  UI / Noto). Interleaved by script group. GOTCHA: the SVG box is 600 units wide —
  CDP measured Tamil/Kannada/Malayalam OVERFLOWING at their first sizes (684/564/
  688), so their `size` was cut to 74/78/72; re-measured ALL new words at their
  configured size+font → every one fits (201–422 < 570) and renders real glyphs
  (no tofu → fonts resolve). tsc+eslint green; tests/build running. Files:
  HelloGreeting.tsx only. NOT pushed.
- **2026-08-25 (light/dark theme toggle)** — Owner: add a moon↔sun SLIDING theme
  toggle left of the navbar brand; dark = default (current look), add a light theme
  matching the site. Because the WHOLE site is driven by :root design tokens, the
  light theme is a clean `:root[data-theme='light']` token-override block (App.css)
  — off-white surfaces + deep-navy text, accents deepened (violet #6d5cff, cyan
  #0891b2, pink #db2777) for light-ground contrast; every rule re-themes via the
  vars. Dark :root is UNTOUCHED (default). New: useTheme.ts (localStorage 'theme',
  sets/removes data-theme on <html>, default dark), ThemeToggle.tsx (a11y
  role=switch, inline moon+sun SVGs in a pill, a sliding knob), wired App.tsx →
  Navbar (left of NavBrand). Boot script in index.html applies saved light BEFORE
  paint (no flash). CSS: `.theme-toggle` pill + `.theme-toggle__knob` slides
  translateX 0→28px and morphs blue-moon→gold-sun (cubic-bezier bounce);
  reduced-motion drops the slide. Spot fixes for hardcoded-light content on light:
  `.section-title` color→var(--text), navbar bg→white-tint (base + is-scrolled);
  the CINEMATIC white-gradient headings kept (they sit on the laptop's own dark
  screen). CDP-verified: default=dark (no attr, knob left/moon), toggle→light
  (data-theme=light, knob right/gold-sun, body bg rgb(238,241,248), text
  rgb(23,26,46), section-title rgb(23,26,46), navbar rgba(255,255,255,.6)),
  persisted to localStorage, applied pre-paint on reload, 0 errors; screenshots
  show a clean pastel light theme + both toggle states. Dark theme visually
  IDENTICAL to before. Gates green. Files: useTheme.ts (new), ThemeToggle.tsx
  (new), App.tsx, Navbar.tsx, App.css, public/index.html. NOT pushed.
- **2026-08-25 (light-mode contrast pass)** — Owner: in light mode some text/icons/
  things weren't visible. Root cause: many surfaces HARDCODE dark colours
  (rgba(5,6,13,...)) or faint WHITE overlays (rgba(255,255,255,0.0x)) that don't
  adapt via tokens. Found them by CDP-screenshotting all light pages + grepping the
  CSS. Biggest offender: the NORMAL footer (`.site-footer` bg rgba(5,6,13,.6)) —
  stayed a dark band on light with dim social icons. Added targeted
  `:root[data-theme='light']` overrides (App.css): `.site-footer` → white glass
  (icons are token-coloured so they now read); `.soft-card`/`.card`/`.hero-quick-
  card`/`[data-tilt]` → clean light glass (were mixing a dark rgba(16,20,38) stop);
  `--text-faint` nudged darker. (`.section-title`, navbar base+scrolled already
  fixed in the prior toggle change.) Cinematic laptop-screen whites left as-is
  (own dark stage). CDP-verified: footer bg now rgba(255,255,255,.65), social
  icons visible, headings dark, navbar light, cards light — screenshots of all
  pages clean; dark theme untouched. Gates: tsc+eslint green; tests/build running.
  Files: App.css only. NOT pushed.
- **2026-08-28 (full desktop landing → MOBILE)** — Owner (inspired by meta.com AI-
  glasses mobile scroll) wants the SAME landing on phones: dot-smash constellation,
  hello greeting, cinematic laptop scroll, floating paths, footer robot — adapted
  to stay smooth on low-end. Approach: new `canRunCinematic()` in lib/env (=
  `!reducedMotion`, drops the fine-pointer + >900px reqs of canRunHeavyDesktopFx)
  → CinematicIntro `enabled` gate + routes.tsx `wantsCinematic` now use it, so the
  whole cinematic (laptop, constellation, greeting, floating paths, RGB keyboard)
  runs on mobile. The mouse-sheen effect no-ops on touch; GSAP ScrollTrigger
  scrubs on touch scroll; constellation still self-tunes via isLowPowerDevice.
  MOBILE laptop layout fix (App.css @≤767px): laptop 70vw→92vw, screen `.cine-scr`
  → single column, hide photo, clamp tagline to 3 lines, hide summary, smaller
  name/btns (desktop 2-col screen was cramped/clipped on a phone). FOOTER ROBOT:
  shouldLoadRobot() dropped the width/fine-pointer gate, added isLowPowerDevice()
  guard (keeps Save-Data + reduced-motion) → loads on CAPABLE phones, still SKIPS
  on ≤4-core/RAM phones so the ~4MB WebGL never hits the weakest devices; restored
  mobile landing-footer min-height 0→340px for the robot's room. LIGHT-THEME
  cinematic fix: `.cinematic-intro` bg hardcoded dark #05060d (was var(--bg)) so
  it stays a dark cinematic stage in light mode; `:root[data-theme=light]
  .cinematic-intro` re-pins the DARK text/accent tokens locally so the headline/
  kicker stay bright on the dark stage. CDP-verified on low-end-emulated 390x844:
  cinematic mounts + laptop shows readable single-col screen (stats grid + RGB kbd)
  + no H-overflow + 0 errors; robot loads on 8-core mobile / skips on 4-core;
  light-theme cinematic headline bright on dark stage; FULL SWEEP (5 pages ×
  desktop/mobile × dark/light = 20) all clean. Spline robot needs its CDN (fails
  in headless sandbox but ErrorBoundary catches → no crash; loads on real device).
  Gates: tsc+eslint+tests 2/2+build green. Files: lib/env.ts, routes.tsx,
  CinematicIntro.tsx, FooterRobot.tsx, App.css. NOT pushed.
- **2026-08-31 (mobile cinematic: greeting + hero photo fixes, on REAL emulator)** —
  Owner reported the hello-greeting and hero photo not showing on the mobile
  landing. Debugged DIRECTLY on the owner's running Android emulator (adb + adb
  reverse tcp:3000 + adb forward to Chrome's chrome_devtools_remote → CDP on
  ws://localhost:9222). Two root causes found+fixed: (1) GREETING was FROZEN — at
  scroll 0 the `.cinematic-intro` wrongly had `.is-offscreen` (my perf-freeze
  class → `animation-play-state:paused` on all descendants), because the
  IntersectionObserver on the pinned intro mis-reports during the GSAP pin-spacer
  distortion on mobile. FIX (CinematicIntro.tsx): replaced the IO with a
  SCROLL-POSITION check (`inView = scrollY < innerHeight*2.4`, rAF-throttled) which
  the pin can't fool. CDP-verified: greeting stroke now animates (offset 1600→0,
  fill fades in), नमस्ते visible on emulator; desktop freeze-on-scroll-past STILL
  works (is-offscreen false at top / true scrolled-past). (2) HERO PHOTO was
  `display:none` on mobile (my earlier over-aggressive laptop-screen simplify).
  FIX (App.css @≤767px): show `.cine-scr__media` as a 64px circular avatar
  (border-radius:50%) above the name in the single-col screen. CDP-verified on
  emulator: photo display:flex, loaded, radius 50%, on-screen when laptop open.
  Also bumped mobile greeting size (min(72vw,340px)) + position (top:24vh) so it's
  clearly visible not lost in the gap. Gates: tsc+eslint+tests 2/2+build green.
  Emulator debug note: `adb forward tcp:9222 localabstract:chrome_devtools_remote`
  gives CDP to the device's Chrome; screencap via `adb shell screencap -p /sdcard/
  x.png && adb pull` (set MSYS_NO_PATHCONV=1 or Git Bash mangles /sdcard paths;
  exec-out prepends a "Multiple displays" warning that corrupts the PNG — use the
  device-file route). Files: CinematicIntro.tsx, App.css. NOT pushed.
- **2026-08-31 (mobile smoothness: low-power tiering)** — Owner wanted smooth
  rendering on ALL mobile sizes/types. Multi-size CDP sweep (280→834px, 12 devices)
  = clean everywhere (no H-overflow, greeting/laptop/photo fit, 0 errors). BUT
  measured FPS on the owner's real Android emulator (4-core, SOFTWARE GPU, via CDP
  over `adb forward ...chrome_devtools_remote`) = only 3-7fps for the full
  cinematic — janky. Isolation showed the per-frame killers (constellation rAF +
  GSAP scrub + 60 hue-rotate keys); even sparsened, a 4-core software-GPU device
  can't run it. (Note: blank page hit 53fps, so the device CAN render; and idle-
  rAF FPS on this emulator proved unreliable to measure — real 4-core phones WITH
  a hardware GPU may fare better, but can't guarantee.) DECISION (owner-approved):
  TIER by device. `canRunCinematic()` now also `&& !isLowPowerDevice()` → capable
  phones (≥6 cores) get the full cinematic; low-power (≤4 cores/RAM, incl. the
  emulator) get the lightweight mobile hero (smooth). To keep the greeting on the
  lite path: mounted `<HelloGreeting>` in HomePage.tsx hero as `.hero-hello-greeting`
  (CSS: display:none desktop, flex ≤767px, left-aligned above the role pill).
  MobileAmbient.tsx now `if (isLowPowerDevice()) return` (its sparse canvas rAF also
  tanked FPS on the emulator — aurora+CSS gradients keep atmosphere). Reverted the
  interim ConstellationGrid low-power gate (redundant now the whole cinematic is
  gated). CDP-verified FRESH 4-core context: cinematic FALSE, greeting shows on
  hero, mobile-ambient canvas idle (rAF gated), no overflow; FRESH 8-core: cinematic
  TRUE (full experience). (8-core-then-4-core in one context stays 8 = module-load
  artifact, not a bug — real devices load fresh.) Gates: tsc+eslint+tests+build
  green. Files: lib/env.ts, HomePage.tsx, MobileAmbient.tsx, ConstellationGrid.tsx,
  App.css. NOT pushed.
- **Verify infra note:** if 9333/dev server are down, relaunch: `BROWSER=none
  npm start` + headless isolated Chrome (`chrome.exe --remote-debugging-port=9333
  --user-data-dir=<scratch> --no-first-run --headless=new`). Never 9222.
