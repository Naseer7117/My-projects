import React from 'react';
import { PortfolioData, RouteKey } from 'types';
import HomePage from 'features/home/HomePage';
import AboutPage from 'features/about/AboutPage';
import SkillsPage from 'features/skills/SkillsPage';
import ProjectsPage from 'features/projects/ProjectsPage';
import ContactPage from 'features/contact/ContactPage';

/*
 * routes.tsx — the single place that maps a route name to the page it renders.
 *
 * App used to switch pages with a chain of `{route === 'home' ? … : null}`.
 * This registry replaces that: rendering the current page is just
 * `pageRenderers[route](ctx)`. Adding a page is a one-line change here (plus its
 * entry in navItems and the RouteKey union in types.ts). The Record<RouteKey, …>
 * type guarantees every route has exactly one renderer — no route can be missed.
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
      <HomePage data={data.hero} onNavigate={navigate} />
      <section id="home-about" aria-label="About"><AboutPage data={data.about} beatEnabled={false} /></section>
      <section id="home-skills" aria-label="Skills"><SkillsPage data={data.skills} beatEnabled={false} /></section>
      <section id="home-projects" aria-label="Projects"><ProjectsPage data={data.projects} beatEnabled={false} /></section>
      <section id="home-contact" aria-label="Contact"><ContactPage data={data.contact} beatEnabled={false} /></section>
    </>
  ),
  about: ({ data }) => <AboutPage data={data.about} />,
  skills: ({ data }) => <SkillsPage data={data.skills} />,
  projects: ({ data }) => <ProjectsPage data={data.projects} />,
  contact: ({ data }) => <ContactPage data={data.contact} />,
};
