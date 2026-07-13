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
import { RouteKey } from 'types';
import { useHashRoute } from 'hooks/useHashRoute';
import { useInteractions } from 'hooks/useInteractions';
import { prefersReducedMotion } from 'lib/env';
import { pageRenderers } from 'app/routes';
import ErrorBoundary from 'components/ErrorBoundary';
import Intro, { IntroVariant } from 'components/effects/Intro';
import PageScan from 'components/effects/PageScan';
import BackgroundFx from 'components/effects/BackgroundFx';
import HeroTicker from 'components/effects/HeroTicker';
import Navbar from 'components/layout/Navbar';
import Footer from 'components/layout/Footer';

// The FULL intro plays once per browser session; later reloads in the same
// session get the QUICK version. No intro at all under reduced-motion.
const initialIntroVariant = (): IntroVariant | null => {
  if (typeof window === 'undefined' || prefersReducedMotion()) {
    return null;
  }
  try {
    return sessionStorage.getItem('introSeen') ? 'quick' : 'full';
  } catch {
    return 'full';
  }
};

// Pages that get the scan effect — on first load AND when navigated to.
const SCAN_ROUTES: RouteKey[] = ['home', 'skills', 'contact'];

// One scan run: `id` keys the overlay so each navigation restarts it fresh;
// `running` is false while the initial-load scan waits for the intro curtains.
type ScanRun = { id: number; variant: IntroVariant; running: boolean };

const App: React.FC = () => {
  const [route, navigate] = useHashRoute('home');
  const [introVariant, setIntroVariant] = React.useState(initialIntroVariant);
  // Initial-load scan: armed (but not sweeping yet) when an intro plays and
  // the visitor lands on a scan-enabled page.
  const [scan, setScan] = React.useState<ScanRun | null>(() =>
    introVariant && SCAN_ROUTES.includes(route)
      ? { id: 0, variant: introVariant, running: false }
      : null
  );
  const scanIdRef = React.useRef(0);
  const { hero } = portfolioData;

  useInteractions(route);

  // Remember that this session has seen an intro, so the next load is quick.
  React.useEffect(() => {
    try {
      sessionStorage.setItem('introSeen', '1');
    } catch {
      /* private mode etc. — the full scan just plays again */
    }
  }, []);

  // Navigating INSIDE the site: entering a scan-enabled page plays a quick
  // scan over the freshly mounted content. Guarded by comparing the previous
  // route VALUE (not a run-once flag) so it skips the initial route — which
  // the intro-coupled scan above handles — and survives StrictMode's
  // double-invoked effects in development.
  const prevRoute = React.useRef(route);
  React.useEffect(() => {
    if (prevRoute.current === route) return;
    prevRoute.current = route;
    if (SCAN_ROUTES.includes(route) && !prefersReducedMotion()) {
      scanIdRef.current += 1;
      setScan({ id: scanIdRef.current, variant: 'quick', running: true });
    } else {
      setScan(null);
    }
  }, [route]);

  // As the intro curtains open: unpause the hero text and start the de-scan
  // sweep over the (still scanned-looking) page content.
  const releaseHero = React.useCallback(() => {
    document.documentElement.classList.remove('intro-active');
    setScan((s) => (s && !s.running ? { ...s, running: true } : s));
  }, []);

  const handleIntroDone = React.useCallback(() => {
    releaseHero();
    setIntroVariant(null);
  }, [releaseHero]);

  const handleScanDone = React.useCallback(() => setScan(null), []);

  // Safety net: never leave the hero paused if the intro doesn't unmount.
  React.useEffect(() => {
    if (!introVariant) document.documentElement.classList.remove('intro-active');
  }, [introVariant]);

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
      {/* The load sequence: the brand intro plays; on scan-enabled pages the
          content behind it is veiled in a "scanned" look (PageScan), and as the
          curtains open a beam sweeps down resolving it to normal. Navigating to
          a scan-enabled page replays a quick scan (keyed by scan.id). */}
      {introVariant ? (
        <Intro variant={introVariant} onExitStart={releaseHero} onDone={handleIntroDone} />
      ) : null}
      {scan ? (
        <PageScan key={scan.id} variant={scan.variant} running={scan.running} onDone={handleScanDone} />
      ) : null}

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
