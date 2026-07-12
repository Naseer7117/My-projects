import React from 'react';
import { RouteKey, NavItem } from 'types';
import NavBrand from 'components/effects/NavBrand';

/*
 * Navbar — the sticky top navigation.
 *
 * The mobile menu is controlled by React state (not Bootstrap's collapse JS,
 * which this app doesn't load). Tapping the hamburger toggles the `show` class
 * on the links container; on desktop (>= md) Bootstrap's `.navbar-expand-md`
 * keeps the links visible regardless. Selecting a link closes the menu.
 */

type NavbarProps = {
  items: NavItem[];
  active: RouteKey;
  onNavigate: (route: RouteKey) => void;
  heroName: string;
};

const Navbar: React.FC<NavbarProps> = ({ items, active, onNavigate, heroName }) => {
  const [open, setOpen] = React.useState(false);

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
        <div
          className={`collapse navbar-collapse main-navbar__collapse${open ? ' show' : ''}`}
          id="mainNav"
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
