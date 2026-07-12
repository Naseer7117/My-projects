import React from 'react';
import { RouteKey } from 'types';
import { navItems } from 'content/portfolio';

/*
 * useHashRoute — the app's tiny client-side router.
 *
 * Reads the URL hash (e.g. "#projects"), validates it against the known routes
 * (from navItems), and keeps a `route` in React state in sync with it. Returns
 * `[route, navigate]`. Extracted out of App so the shell doesn't own routing.
 */

const allowedRoutes: RouteKey[] = navItems.map((item) => item.route);

const sanitizeRoute = (hash: string): RouteKey => {
  const clean = hash.replace('#', '').toLowerCase();
  return (allowedRoutes.includes(clean as RouteKey) ? clean : 'home') as RouteKey;
};

export function useHashRoute(initial: RouteKey): [RouteKey, (next: RouteKey) => void] {
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

    const handleHashChange = () => setRoute(sanitizeRoute(window.location.hash));
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
}
