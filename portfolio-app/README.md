# Naseeruddin Shaik — Portfolio Website

A personal portfolio site built with **React 19 + TypeScript + Framer Motion**.
Dark, animated, "premium" look — particle background, custom cursor, a
full-screen intro loader, scroll reveals, page transitions, and a roaming
animated robot mascot ("Maska Bhai") that walks around the site.

Written so **anyone new to the project can understand how it's organised and
how to change things.**

> **Continuing development / picking up as a coding agent?** Read
> [`HANDOFF.md`](./HANDOFF.md) first. It's the full technical briefing: the
> mascot architecture and its do-not-break invariants, the animation-clip
> pipeline, the verification playbook, and the live work queue. This README is
> the human-facing overview; HANDOFF.md is the deep detail.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Tech stack](#2-tech-stack)
3. [Run it locally](#3-run-it-locally)
4. [⭐ The one file you edit most: content](#4--the-one-file-you-edit-most-content)
5. [Folder & file map](#5-folder--file-map)
6. [How the app works (data flow)](#6-how-the-app-works-data-flow)
7. [The effects layer](#7-the-effects-layer)
8. [Maska Bhai — the mascot](#8-maska-bhai--the-mascot)
9. ["How do I…?" recipes](#9-how-do-i-recipes)
10. [Accessibility & performance](#10-accessibility--performance)
11. [Commands](#11-commands)
12. [Deployment](#12-deployment)

---

## 1. The big picture

A **single-page website** (SPA): one HTML page, and JavaScript swaps the visible
content when you click a menu item (Home, About, Skills, Projects, Contact). The
URL changes to `#about` etc., but the page never fully reloads (a tiny custom
hash router, `useHashRoute` — no router library).

Two ideas keep it easy to reason about:

- **Content is separated from code.** Every word on the site lives in **one
  file**: `src/content/portfolio.ts`. Components just *display* what's in it.
- **Look lives in CSS; behaviour lives in hooks.** Styling is in
  `src/app/App.css`. The interactive animation logic is split into small focused
  hooks under `src/hooks/`.

---

## 2. Tech stack

| Tool | What it is | Why it's here |
|------|-----------|---------------|
| **React 19** | UI library, components. | Pages built as small reusable pieces. |
| **TypeScript** | JS + type checking. | Catches field typos before the site runs. |
| **Create React App** | Bundler/dev server (react-scripts). | `npm start` (dev) and `npm run build` (prod). |
| **Framer Motion** | Animation library. | Page transitions, and all of the mascot's spring-based motion. Used via `LazyMotion` strict mode — components are `m.*`, never `motion.*`. |
| **Bootstrap 5 (CSS)** | Responsive grid. | Layout only; colours/styling come from our `App.css`. |
| **Canvas + CSS** | Hand-written effects. | Particle background, cursor, reveals. |

---

## 3. Run it locally

Needs **Node.js 18+**. From the `portfolio-app` folder:

```bash
npm install     # first time only
npm start       # dev mode at http://localhost:3000 (auto-reloads on save)
```

Production build:

```bash
npm run build   # outputs a static "build/" folder ready to host
```

---

## 4. ⭐ The one file you edit most: content

**`src/content/portfolio.ts`** holds *every piece of text* on the site, grouped
by page, plus the nav items:

```ts
export const portfolioData = {
  hero:     { … },  // Home (name, tagline, intro, photo)
  about:    { … },  // biography + career timeline
  skills:   { … },  // skill groups
  projects: { … },  // project cards
  contact:  { … },  // email, socials
  socialMedia: [ … ],
};
export const navItems = [ … ];
```

Change your tagline? Edit `hero.tagline`. Add a job? Add to `about.timeline`.
**You never touch layout code to change words.**

`src/types/index.ts` describes the *shape* each object must have — add a field
the type doesn't know about and TypeScript warns you.

---

## 5. Folder & file map

```
portfolio-app/
├── public/
│   ├── index.html            The single HTML page.
│   └── assets/mascot/         Maska Bhai's animation clips (transparent WebP).
├── src/
│   ├── index.tsx             Renders <App> into the page.
│   ├── index.css             Global base styles.
│   ├── app/
│   │   ├── App.tsx           ROOT component: routing, chrome (navbar/footer/
│   │   │                     background), intro, and mounts the mascot.
│   │   ├── App.css           ALL styling and CSS animations (labelled sections).
│   │   └── routes.tsx        Route registry: maps a route → its page component.
│   ├── content/
│   │   └── portfolio.ts       ⭐ ALL website text lives here. Edit this.
│   ├── types/index.ts        TypeScript shapes for the content (see §4).
│   ├── features/             One folder per page; each renders its slice of data.
│   │   ├── home/  about/  skills/  projects/  contact/
│   ├── components/
│   │   ├── layout/            Navbar, Footer.
│   │   ├── effects/           Intro, PageScan, BackgroundFx, HeroTicker,
│   │   │                      PageTransition, and the mascot:
│   │   │                      CompanionCharacter + AnimatedMascotPlayer.
│   │   └── ErrorBoundary.tsx  One broken page can't blank the whole site.
│   ├── hooks/
│   │   ├── useHashRoute.ts     URL-hash → route value.
│   │   ├── useInteractions.ts  Wires up the general effects per route.
│   │   └── interactions/       Focused hooks: cursor FX, tilt, magnetic, scroll
│   │                           reveal/progress, portrait slideshow, intro
│   │                           narration, and the mascot's brain
│   │                           (useCompanionBehavior + friends).
│   ├── lib/                   Shared constants & helpers (companionConfig,
│   │                          companionZones, companionPerch, constants, env).
│   └── images/               Portrait photos.
├── scripts/                  Python clip-conversion + normalization tools, and
│                             Node CDP verification templates (scripts/verify/).
├── HANDOFF.md                Deep technical briefing for the next developer/agent.
└── package.json
```

---

## 6. How the app works (data flow)

```
portfolio.ts   →   App.tsx   →   routes.tsx   →   the current page   →   screen
(the content)      (routing)     (registry)       (features/*)
```

1. **`index.tsx`** renders `<App />`.
2. **`App.tsx`** reads the URL hash via `useHashRoute` → a `route` like `"projects"`.
3. **`routes.tsx`** maps that route to one page component, handed the matching
   slice of `portfolioData`, rendered inside an `ErrorBoundary` and a
   `PageTransition` (fade/lift between pages).
4. Each **page** (under `features/`) loops over its data and renders cards/lists.
   It holds no text of its own.
5. **`useInteractions(route)`** wires the general animations; the mascot runs
   independently from its own hooks.

---

## 7. The effects layer

- **Visuals** are HTML + CSS: full-screen layers in `App.tsx`
  (`<canvas className="particles">`, background FX, cursor dots), styled/animated
  in `App.css`.
- **Behaviour** is split into small hooks under `src/hooks/interactions/`:
  particle cursor field, scroll reveals, 3D card tilt, magnetic buttons,
  scroll-progress bar, portrait slideshow, and the "Play Intro" narration.

**Scroll reveals:** any element with `data-reveal` in the JSX fades/slides in as
you scroll to it (`data-tilt` for 3D cards). The **intro loader** (`Intro.tsx`)
shows on load, then reveals the site.

---

## 8. Maska Bhai — the mascot

A roaming animated robot ("Maska Bhai", NS01 design: white ceramic body, LED
visor, gold trim, navy cape, "NS" chest badge) that lives across the whole site.
Every pose is a **video-derived transparent WebP** in `public/assets/mascot/`.
On real spring physics (never teleports), he:

- **walks on the page content** — the tops of cards, section headings, and the
  big "Hi, I am…" hero heading — pacing across wide ones step by step;
- **auto-shrinks to fit** a tight element so he's never too big to stand on it,
  feet always planted on the border;
- **stands on the bottom edge** (like a taskbar) and roams the bottom band;
- **reacts to your cursor** (walks over, waves / high-fives);
- **peeks** from screen edges, and **dozes off** after ~22s idle, waking with a
  stretch when you move;
- cycles a fair-shuffle of idle moves (stretch, dance, think, doze, …).

He's **disabled under reduced-motion** and is a smaller fixed-corner buddy on
mobile.

He's the main focus of ongoing work. **Full architecture, the do-not-break
invariants, the animation-clip conversion pipeline, and the verification
playbook are all in [`HANDOFF.md`](./HANDOFF.md)** — start there before changing
anything mascot-related. Quick pointers:

- **Sizes/zones:** `src/lib/companionConfig.ts`, `companionZones.ts`, `companionPerch.ts`.
- **Brain (state machine):** `src/hooks/interactions/useCompanionBehavior.ts`.
- **Renderer + clips:** `src/components/effects/CompanionCharacter.tsx` and `AnimatedMascotPlayer.tsx`.
- **Tunables:** `src/lib/constants.ts` (`COMPANION_*`).
- **New clips** must go through `scripts/normalize_clips.py` (keeps him a
  consistent size) — see HANDOFF §4.

He's disabled entirely under reduced-motion, and sits in a fixed corner on
mobile instead of roaming.

---

## 9. "How do I…?" recipes

| I want to… | Do this |
|------------|---------|
| **Change any text** | Edit `src/content/portfolio.ts`. |
| **Add a project card** | Add an object to `projects` in the content file. |
| **Add a timeline job** | Add an object to `about.timeline`. |
| **Change the colours** | Edit the CSS variables at the top of `src/app/App.css` (`--accent`, `--bg`, …). |
| **Add a page** | Add a renderer in `src/app/routes.tsx`, a `navItems` entry, and extend the `RouteKey` type. |
| **Change mascot behaviour** | Read `HANDOFF.md` first, then tune `src/lib/constants.ts` (`COMPANION_*`). |
| **Add a mascot animation** | Convert/normalize the clip (`scripts/normalize_clips.py`), drop it in `public/assets/mascot/`, add its `POSES` line — see HANDOFF §4. |

---

## 10. Accessibility & performance

- **Reduced motion:** with OS "reduce motion" on, the heavy effects and the
  mascot are switched off (`prefers-reduced-motion` in `App.css` + hook checks).
- **Touch devices:** the custom cursor, particle field, and mascot roaming are
  skipped/simplified on phones and tablets.
- **Resilience:** an `ErrorBoundary` keeps one broken page from blanking the site.
- **Performance:** effects pause when the tab is hidden; the mascot's animation
  clips preload in tiers (essentials first, the rest at browser idle, skipped
  under Save-Data).

---

## 11. Commands

| Command | What it does |
|---------|--------------|
| `npm start` | Run locally at http://localhost:3000 with auto-reload. |
| `npm run build` | Build the optimized production version into `build/`. |
| `npm test -- --watchAll=false` | Run the test suite once (CI mode). |
| `npx tsc --noEmit` | Type-check without building. |
| `npx eslint src --ext .ts,.tsx --max-warnings=0` | Lint. |

The definition of "done" for any change: all of the above green, plus a visual
check for anything user-facing (see HANDOFF's verification playbook).

---

## 12. Deployment

`netlify.toml` at the monorepo root builds/publishes **only** this
`portfolio-app` folder (`npm run build` → `build/`). Routing is hash-based, so no
SPA redirect rules are needed. Pushing to the repo triggers the deploy — so a
push is a live deploy.
