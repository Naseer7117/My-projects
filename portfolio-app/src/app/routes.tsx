import React from 'react';
import { PortfolioData, RouteKey } from 'types';
import { canRunCinematic } from 'lib/env';
import HomePage from 'features/home/HomePage';
import AboutPage from 'features/about/AboutPage';
import SkillsPage from 'features/skills/SkillsPage';
import ProjectsPage from 'features/projects/ProjectsPage';
import ContactPage from 'features/contact/ContactPage';

// Lazy: CinematicIntro pulls in GSAP (~120KB) and only ever runs on the desktop
// Home opener — keep it out of the initial/main bundle. Suspense fallback is
// null (nothing shows until it loads; it renders null on mobile/reduced-motion
// anyway). Loaded in its own chunk.
const CinematicIntro = React.lazy(() => import('components/effects/CinematicIntro'));

/*
 * Whether the cinematic opener will actually RUN — the same gate CinematicIntro
 * checks internally (motion allowed; NOW includes mobile per the owner's ask for
 * the same landing experience on phones). Rendering the lazy component is what
 * triggers React.lazy to fetch its GSAP chunk, so we gate the RENDER on this:
 * reduced-motion visitors (who would only see the component render null) still
 * don't download GSAP. Evaluated once at module load (matches the component's own
 * one-shot gate).
 */
const wantsCinematic = canRunCinematic();

/*
 * routes.tsx — the single place that maps a route name to the page it renders.
 *
 * App used to switch pages with a chain of `{route === 'home' ? … : null}`.
 * This registry replaces that: rendering the current page is just
 * `pageRenderers[route](ctx)`. Adding a page is a one-line change here (plus its
 * entry in navItems and the RouteKey union in types.ts). The Record<RouteKey, …>
 * type guarantees every route has exactly one renderer — no route can be missed.
 *
 * CHECKLIST when adding a route: (1) RouteKey union in types/index.ts,
 * (2) navItems in content/portfolio.ts, (3) a renderer here, and — if the new
 * route should get the de-scan overlay — (4) add it to SCAN_ROUTES in App.tsx.
 * (4) is NOT type-enforced, so it's easy to miss.
 */

export type PageContext = {
  data: PortfolioData;
  navigate: (route: RouteKey) => void;
};

export const pageRenderers: Record<RouteKey, (ctx: PageContext) => React.ReactNode> = {
  // Home is a LONG-SCROLL landing: the hero followed by every other section
  // stacked top-to-bottom, so scrolling the home page walks through the whole
  // site. The nav buttons still load each section as its OWN standalone page
  // (the other renderers below) — both modes coexist per the owner's ask.
  // Stacked sections get `beatEnabled={false}` so their mascot context beats
  // don't all fire at mount and stomp each other; the mascot still roams the
  // whole scroll via its normal perch/climb on headings, cards, and the photo.
  // Section ids are prefixed `home-` so they never collide with the router's
  // own `#about`/`#skills`/… hashes.
  home: ({ data, navigate }) => (
    <>
      {/* Scroll-pinned cinematic opener (desktop, motion allowed) — releases
          into the long-scroll below. Only mounted when it will actually run, so
          the ~2MB GSAP chunk is never fetched for mobile/reduced-motion users
          (who would only see it render null). */}
      {wantsCinematic ? (
        <React.Suspense fallback={null}>
          <CinematicIntro
            name={data.hero.name}
            role={data.hero.role}
            tagline={data.hero.tagline}
            summary={data.hero.summary}
            photoSrc={data.hero.photo.src}
            photoAlt={data.hero.photo.alt}
            metrics={data.hero.metrics ?? []}
            onViewProjects={() => navigate('projects')}
            onContact={() => navigate('contact')}
          />
        </React.Suspense>
      ) : null}
      <HomePage data={data.hero} onNavigate={navigate} />
      <section id="home-about" aria-label="About"><AboutPage data={data.about} beatEnabled={false} /></section>
      <section id="home-skills" aria-label="Skills"><SkillsPage data={data.skills} beatEnabled={false} holoBadges /></section>
      <section id="home-projects" aria-label="Projects"><ProjectsPage data={data.projects} beatEnabled={false} /></section>
      <section id="home-contact" aria-label="Contact"><ContactPage data={data.contact} beatEnabled={false} /></section>
    </>
  ),
  about: ({ data }) => <AboutPage data={data.about} />,
  skills: ({ data }) => <SkillsPage data={data.skills} />,
  projects: ({ data }) => <ProjectsPage data={data.projects} />,
  contact: ({ data }) => <ContactPage data={data.contact} />,
};
