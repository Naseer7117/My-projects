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
  home: ({ data, navigate }) => <HomePage data={data.hero} onNavigate={navigate} />,
  about: ({ data }) => <AboutPage data={data.about} />,
  skills: ({ data }) => <SkillsPage data={data.skills} />,
  projects: ({ data }) => <ProjectsPage data={data.projects} />,
  contact: ({ data }) => <ContactPage data={data.contact} />,
};
