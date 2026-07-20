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
