import React from 'react';
import { m } from 'framer-motion';
import { RouteKey, NavItem } from 'types';
import NavBrand from 'components/effects/NavBrand';
import { prefersReducedMotion } from 'lib/env';

/*
 * Navbar — the sticky top navigation.
 *
 * The mobile menu is controlled by React state (not Bootstrap's collapse JS,
 * which this app doesn't load). Tapping the hamburger animates the links
 * container open/closed (height: auto + fade); on desktop (>= md) Bootstrap's
 * `.navbar-expand-md` keeps the links visible regardless — the collapse div
 * stays mounted at all times (never conditionally rendered) specifically so
 * that CSS override still applies. Selecting a link closes the menu.
 */

const COLLAPSE_VARIANTS = {
  closed: { height: 0, opacity: 0 },
  open: { height: 'auto', opacity: 1 },
};

// Matches Bootstrap's own .navbar-expand-md breakpoint (see bootstrap.min.css:
// "@media (min-width:768px)"). At/above this width the links are always
// visible via CSS regardless of the mobile `open` state, so the animation
// must not force height/opacity to 0 there.
const MD_BREAKPOINT_QUERY = '(min-width: 768px)';

function useIsDesktopNav(): boolean {
  const [isDesktop, setIsDesktop] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(MD_BREAKPOINT_QUERY).matches
  );
  React.useEffect(() => {
    const mql = window.matchMedia(MD_BREAKPOINT_QUERY);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

type NavbarProps = {
  items: NavItem[];
  active: RouteKey;
  onNavigate: (route: RouteKey) => void;
  heroName: string;
};

const Navbar: React.FC<NavbarProps> = ({ items, active, onNavigate, heroName }) => {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useIsDesktopNav();

  const go = (route: RouteKey) => {
    onNavigate(route);
    setOpen(false); // close the mobile menu after navigating
  };

  return (
    <nav className="navbar navbar-expand-md main-navbar sticky-top">
      <div className="container-fluid main-navbar__container">
        <NavBrand name={heroName} onClick={() => go('home')} />
        <button
          className="navbar-toggler ms-auto"
          type="button"
          aria-controls="mainNav"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <m.div
          className={`collapse navbar-collapse main-navbar__collapse${open ? ' show' : ''}`}
          id="mainNav"
          variants={COLLAPSE_VARIANTS}
          initial={false}
          animate={isDesktop || open ? 'open' : 'closed'}
          transition={prefersReducedMotion() ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
        >
          <ul className="navbar-nav ms-md-auto main-navbar__links">
            {items.map((item) => (
              <li className="nav-item" key={item.route}>
                <button
                  type="button"
                  className={`nav-link btn btn-link${active === item.route ? ' active' : ''}`}
                  onClick={() => go(item.route)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </m.div>
      </div>
    </nav>
  );
};

export default Navbar;
