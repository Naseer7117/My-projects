/*
 * App.tsx — the COMPOSITION ROOT (the app shell).
 *
 * Its only job is to wire the pieces together:
 *   - decide the current route (useHashRoute) and set up all motion
 *     (useInteractions),
 *   - render the persistent chrome: background effects, navbar, ticker, footer,
 *   - render the current page from the route registry, inside an ErrorBoundary,
 *   - show the intro loader on first load.
 *
 * Everything with real logic lives elsewhere (hooks/, components/, features/).
 */
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { portfolioData, navItems } from 'content/portfolio';
import { useHashRoute } from 'hooks/useHashRoute';
import { useInteractions } from 'hooks/useInteractions';
import { prefersReducedMotion } from 'lib/env';
import { pageRenderers } from 'app/routes';
import ErrorBoundary from 'components/ErrorBoundary';
import Intro from 'components/effects/Intro';
import BackgroundFx from 'components/effects/BackgroundFx';
import HeroTicker from 'components/effects/HeroTicker';
import Navbar from 'components/layout/Navbar';
import Footer from 'components/layout/Footer';

// Show the intro on every load — but never under reduced-motion.
const shouldShowIntro = (): boolean =>
  typeof window !== 'undefined' && !prefersReducedMotion();

const App: React.FC = () => {
  const [route, navigate] = useHashRoute('home');
  const [showIntro, setShowIntro] = React.useState(shouldShowIntro);
  const { hero } = portfolioData;

  useInteractions(route);

  const releaseHero = React.useCallback(() => {
    document.documentElement.classList.remove('intro-active');
  }, []);

  const handleIntroDone = React.useCallback(() => {
    releaseHero();
    setShowIntro(false);
  }, [releaseHero]);

  // Safety net: never leave the hero paused if the intro doesn't unmount.
  React.useEffect(() => {
    if (!showIntro) document.documentElement.classList.remove('intro-active');
  }, [showIntro]);

  // Scroll to the top on every route change.
  React.useEffect(() => {
    if (typeof window.scrollTo !== 'function') return;
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [route]);

  const isHome = route === 'home';

  return (
    <div className="app">
      {showIntro ? <Intro onExitStart={releaseHero} onDone={handleIntroDone} /> : null}

      <BackgroundFx />

      <Navbar items={navItems} active={route} onNavigate={navigate} heroName={hero.name} />

      {isHome ? <HeroTicker /> : null}

      <main className="page-shell">
        <ErrorBoundary key={route}>
          {pageRenderers[route]({ data: portfolioData, navigate })}
        </ErrorBoundary>
      </main>

      {isHome ? <HeroTicker footer /> : null}

      <Footer name={hero.name} />
    </div>
  );
};

export default App;
