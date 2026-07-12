# Naseeruddin Shaik — Portfolio Website

A personal portfolio website built with **React + TypeScript**. It has a dark,
animated, "premium" look: a particle background, a custom mouse cursor, a
full-screen intro loader, scroll animations, and more.

This README is written so that **anyone — even a junior developer or someone new
to React — can understand how the project is organised and how to change things.**

---

## Table of contents

1. [What is this? (the big picture)](#1-what-is-this-the-big-picture)
2. [The tech stack, in plain English](#2-the-tech-stack-in-plain-english)
3. [How to run it on your computer](#3-how-to-run-it-on-your-computer)
4. [⭐ The one file you edit most: the content file](#4--the-one-file-you-edit-most-the-content-file)
5. [Folder & file map](#5-folder--file-map)
6. [How the app works (data flow)](#6-how-the-app-works-data-flow)
7. [The animation / effects layer](#7-the-animation--effects-layer)
8. ["How do I…?" quick recipes](#8-how-do-i-quick-recipes)
9. [Accessibility & performance](#9-accessibility--performance)
10. [Available commands](#10-available-commands)
11. [Putting it online (deployment)](#11-putting-it-online-deployment)

---

## 1. What is this? (the big picture)

It's a **single-page website** (SPA). That means the whole site is one HTML page,
and JavaScript swaps the visible content when you click a menu item (Home,
About, Skills, Projects, Contact). The URL changes to things like `#about`, but
the page never fully reloads.

Two ideas make the whole project easy to reason about:

- **Content is separated from code.** All the words you see on the site (your
  name, job history, skills, project descriptions) live in **one file**:
  `src/data/portfolioData.ts`. The React components just *display* whatever is in
  that file. So to update the site's text, you edit that one file — not the
  layout code.
- **Look & animation live in CSS + one hook.** All colours, spacing, and styles
  are in `src/App.css`. All the interactive animation logic (cursor, particles,
  scroll reveals) is in `src/hooks/useInteractions.ts`.

---

## 2. The tech stack, in plain English

| Tool | What it is | Why it's here |
|------|-----------|---------------|
| **React** | A library for building user interfaces out of reusable "components". | Lets us build the pages as small pieces (HomePage, NavigationBar, …). |
| **TypeScript** | JavaScript + type checking. | Catches mistakes early (e.g. a typo in a field name) before the site runs. |
| **Create React App** | The tool that bundles/serves the project. | Gives us `npm start` (dev) and `npm run build` (production) for free. |
| **Bootstrap** | A CSS framework. | We use its responsive grid (`row`, `col-lg-6`, …) for layout. The colours/styling are overridden by our own `App.css`. |
| **Plain CSS + Canvas** | No animation libraries. | All effects are hand-written, which keeps the site small and fast. |

---

## 3. How to run it on your computer

You need **Node.js** installed (version 18+). Then, in a terminal, from the
`portfolio-app` folder:

```bash
npm install     # download dependencies (only needed the first time)
npm start       # start the site in development mode
```

Then open **http://localhost:3000** in your browser. The page automatically
refreshes when you save a file.

To make an optimized version for hosting:

```bash
npm run build   # creates a "build" folder ready to upload to a web host
```

---

## 4. ⭐ The one file you edit most: the content file

**`src/data/portfolioData.ts`** holds *every piece of text* on the site, grouped
by page:

```ts
export const portfolioData = {
  hero:     { ...},   // the Home page (name, tagline, metrics, photo)
  about:    { ...},   // biography + the career timeline
  skills:   { ...},   // skill groups + tool list
  projects: { ...},   // the project cards
  contact:  { ...},   // email, location, services, links
};
```

Want to change your tagline? Find `hero.tagline` and edit the text. Want to add a
job to your timeline? Add an item to the `about.timeline` list. **You never have
to touch the layout code to change words.**

`src/types.ts` describes the *shape* each of these objects must have (which
fields exist and whether they're text, numbers, or lists). If you add a field to
the content that isn't in the type, TypeScript will warn you — that's a feature,
not a bug.

---

## 5. Folder & file map

```
portfolio-app/
├── public/
│   └── index.html         The single HTML page. Contains <head> tags, the fonts,
│                          and a tiny startup script (see comments inside it).
├── src/
│   ├── index.tsx          Start point: tells React to render <App> into the page.
│   ├── App.tsx            The ROOT component. Holds the navbar, footer, the
│   │                      background effect layers, the intro, and decides which
│   │                      page to show based on the URL (#home, #about, …).
│   ├── Intro.tsx          The full-screen loading intro (0→100%, then curtain
│   │                      splits to reveal the site). Shown once per page load.
│   ├── App.css            ALL the styling and animations (colours, layout,
│   │                      keyframes). Organised into labelled sections.
│   ├── types.ts           TypeScript "shapes" for the content (see section 4).
│   │
│   ├── data/
│   │   └── portfolioData.ts   ⭐ ALL the website text lives here. Edit this.
│   │
│   ├── pages/             One file per page. Each just displays its slice of the
│   │   ├── HomePage.tsx        content data. They receive data as a "prop".
│   │   ├── AboutPage.tsx
│   │   ├── SkillsPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   └── ContactPage.tsx
│   │
│   ├── hooks/
│   │   └── useInteractions.ts  All the interactive animation logic in one place:
│   │                           particle background, custom cursor, scroll
│   │                           reveals, 3D tilt, magnetic buttons, etc.
│   │
│   └── images/            The portrait photos used on the Home page.
│
├── build/                 (Generated by `npm run build` — safe to delete/ignore.)
└── package.json           Lists dependencies and the npm commands.
```

---

## 6. How the app works (data flow)

Think of it as a simple pipeline:

```
portfolioData.ts   →   App.tsx   →   the current Page   →   what you see
(the content)          (routing)     (HomePage, etc.)       (HTML on screen)
```

Step by step:

1. **`index.tsx`** starts everything by rendering `<App />`.
2. **`App.tsx`** reads the URL hash (e.g. `#projects`). A small helper
   (`useHashRoute`) turns that into a `route` value like `"projects"`.
3. Based on `route`, `App.tsx` shows exactly one page component and hands it the
   matching slice of data, e.g. `<ProjectsPage data={projects} />`.
4. Each **page component** loops over its data and renders the cards/lists. It
   holds no text of its own — everything comes from the data file.
5. **`useInteractions(route)`** (called inside `App`) wires up all the animations
   and re-scans the page whenever the route changes.

---

## 7. The animation / effects layer

There are two halves that work together:

- **The visuals** are HTML elements + CSS. In `App.tsx` you'll see a set of
  full-screen layers near the top: `<canvas className="particles">`, `.beam`,
  `.aurora`, `.spotlight`, `.grain`, plus the two cursor dots. They're styled and
  animated in `App.css`.
- **The behaviour** is in `src/hooks/useInteractions.ts`. It's one custom React
  hook that:
  - draws the **particle constellation** on the canvas and makes it follow the mouse,
  - moves the **custom cursor** (a dot + a trailing ring),
  - runs the **scroll reveals** (elements fade/slide in when they enter the screen),
  - handles **3D tilt** on cards and **magnetic** buttons,
  - updates the top **scroll-progress bar** and the **navbar** shadow.

**Scroll reveals — the one trick to know:** any element that should animate in as
you scroll to it has the attribute `data-reveal` in the JSX (search the code for
`data-reveal`). The hook watches those elements and adds an `is-in` class when
they appear; the CSS then animates them. Cards that tilt in 3D have `data-tilt`.

The **intro loader** is a separate component, `Intro.tsx`. `App.tsx` shows it on
load and hides it (`setShowIntro(false)`) when it finishes.

---

## 8. "How do I…?" quick recipes

| I want to… | Do this |
|------------|---------|
| **Change any text** (name, tagline, bio, projects…) | Edit `src/data/portfolioData.ts`. |
| **Add a project card** | Add an object to `projects.featured` in the content file. |
| **Add a job to the timeline** | Add an object to `about.timeline`. |
| **Swap the photo** | Put your image in `src/images/`, then update the `import` and `photo.src` in `portfolioData.ts` (or overwrite `src/images/mewithdesk1.png`). |
| **Change the colours** | Edit the CSS variables at the very top of `src/App.css` (`--accent`, `--accent-2`, `--bg`, …). Every colour references these. |
| **Change the intro length** | Edit the `LOAD_MS` / `EXIT_MS` numbers at the top of `src/Intro.tsx`. |
| **Change the words in the scrolling ticker** | Edit the `heroTickerWords` list in `src/App.tsx`. |
| **Turn an effect off** | Delete its element in `App.tsx` (e.g. remove `<canvas className="particles" />`) — everything is optional and independent. |

---

## 9. Accessibility & performance

- **Reduced motion:** if a visitor has "reduce motion" turned on in their OS,
  *all* the heavy effects (particles, cursor, intro, reveals) are automatically
  switched off and the site shows static content. This is handled with the
  `prefers-reduced-motion` media query in `App.css` and checks in the hook.
- **Touch devices:** the custom cursor and magnetic buttons are skipped on phones
  and tablets (they only make sense with a mouse).
- **If JavaScript fails to load:** a small script in `public/index.html` reveals
  all content after a few seconds so the page is never stuck blank.
- **Performance:** the particle count scales to the screen size, all effects run
  in one shared animation loop, and animations pause when the browser tab is
  hidden.

---

## 10. Available commands

| Command | What it does |
|---------|--------------|
| `npm start` | Run locally at http://localhost:3000 with auto-reload. |
| `npm run build` | Build the optimized production version into `build/`. |
| `npm test` | Run tests (interactive). |

---

## 11. Putting it online (deployment)

Run `npm run build`. That creates a `build/` folder containing plain static files
(HTML, CSS, JS). Upload that folder to any static host — for example
**Netlify**, **Vercel**, **GitHub Pages**, or **Cloudflare Pages**. No server or
database is required.
