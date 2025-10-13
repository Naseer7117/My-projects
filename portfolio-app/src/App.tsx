import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import SkillsPage from './pages/SkillsPage';
import ProjectsPage from './pages/ProjectsPage';
import ContactPage from './pages/ContactPage';
import { navItems, portfolioData } from './data/portfolioData';
import { RouteKey, NavItem } from './types';

const allowedRoutes: RouteKey[] = navItems.map((item) => item.route) as RouteKey[];

const sanitizeRoute = (hash: string): RouteKey => {
  const clean = hash.replace('#', '').toLowerCase();
  if (allowedRoutes.includes(clean as RouteKey)) {
    return clean as RouteKey;
  }
  return 'home';
};

const useHashRoute = (initial: RouteKey): [RouteKey, (next: RouteKey) => void] => {
  const getRouteFromHash = () => {
    if (typeof window === 'undefined' || !window.location.hash) {
      return initial;
    }
    return sanitizeRoute(window.location.hash);
  };

  const [route, setRoute] = React.useState<RouteKey>(getRouteFromHash);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      window.location.hash = `#${initial}`;
      setRoute(initial);
    }

    const handleHashChange = () => {
      setRoute(sanitizeRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initial]);

  const navigate = React.useCallback((next: RouteKey) => {
    if (typeof window === 'undefined') {
      setRoute(next);
      return;
    }

    const nextHash = `#${next}`;
    if (window.location.hash === nextHash) {
      setRoute(next);
      return;
    }

    window.location.hash = nextHash;
  }, []);

  return [route, navigate];
};

type NavigationProps = {
  items: NavItem[];
  active: RouteKey;
  onNavigate: (route: RouteKey) => void;
  heroName: string;
};

const NavigationBar: React.FC<NavigationProps> = ({ items, active, onNavigate, heroName }) => (
  <nav className="navbar navbar-expand-md main-navbar sticky-top">
    <div className="container-fluid main-navbar__container">
      <button type="button" className="hero-navbar-brand" onClick={() => onNavigate('home')}>
        {heroName}
      </button>
      <button
        className="navbar-toggler ms-auto"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse main-navbar__collapse" id="mainNav">
        <ul className="navbar-nav ms-md-auto main-navbar__links">
          {items.map((item) => (
            <li className="nav-item" key={item.route}>
              <button
                type="button"
                className={`nav-link btn btn-link${active === item.route ? ' active' : ''}`}
                onClick={() => onNavigate(item.route)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </nav>
);

const heroTickerWords = [
  'Software',
  'Engineer',
  'Coding',
  'Java',
  'JavaScript',
  'SQL',
  'TypeScript',
  'React',
  'Selenium',
  'C++',
  'C',
  'C#',
  'HTML',
  'CSS',
  'Database',
  'Python',
  'www.',
];
const heroTickerSequence = [...heroTickerWords, ...heroTickerWords];

const App: React.FC = () => {
  const [route, navigate] = useHashRoute('home');
  const { hero, about, skills, projects, contact } = portfolioData;

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') {
      return;
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [route]);

  return (
    <div className="app">
      <NavigationBar items={navItems} active={route} onNavigate={navigate} heroName={hero.name} />
      {route === 'home' ? (
        <div className="hero-ticker" aria-hidden="true">
          <div className="hero-ticker__fade hero-ticker__fade--left" />
          <div className="hero-ticker__fade hero-ticker__fade--right" />
          <div className="hero-ticker__inner">
            {heroTickerSequence.map((word, index) => (
              <span className="hero-ticker__item" key={`hero-ticker-${index}-${word}`}>
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <main className="page-shell">
        {route === 'home' ? <HomePage data={hero} onNavigate={navigate} /> : null}
        {route === 'about' ? <AboutPage data={about} /> : null}
        {route === 'skills' ? <SkillsPage data={skills} /> : null}
        {route === 'projects' ? <ProjectsPage data={projects} /> : null}
        {route === 'contact' ? <ContactPage data={contact} /> : null}
      </main>
      {route === 'home' ? (
        <div className="hero-ticker hero-ticker--footer" aria-hidden="true">
          <div className="hero-ticker__fade hero-ticker__fade--left" />
          <div className="hero-ticker__fade hero-ticker__fade--right" />
          <div className="hero-ticker__inner hero-ticker__inner--footer">
            {heroTickerSequence.map((word, index) => (
              <span className="hero-ticker__item" key={`hero-ticker-footer-${index}-${word}`}>
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <footer className="site-footer py-4">
        <div className="container text-center footer-credit-wrapper">
          <span className="footer-credit">
            &copy; {new Date().getFullYear()} {hero.name}. Crafted with care.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
