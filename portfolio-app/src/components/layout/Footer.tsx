import React from 'react';
import { SocialMedia } from 'types';
import SocialOrbit from 'components/layout/SocialOrbit';
import SocialBar from 'components/layout/SocialBar';
import FooterRobot from 'components/layout/FooterRobot';

/*
 * Footer — two variants:
 *   'landing' (Home only): the BIG footer — a blended Spline 3D robot that
 *      follows the cursor, the orbiting social buttons on top, neon credit.
 *   'normal' (every other page): a compact footer — a plain row of social icon
 *      buttons (SocialBar) + the same neon credit. No robot, no orbit.
 * App.tsx passes the variant from `isHome`.
 */

type FooterProps = {
  name: string;
  socials: SocialMedia[];
  variant?: 'landing' | 'normal';
};

const Credit: React.FC<{ name: string }> = ({ name }) => (
  <span className="footer-credit">
    &copy; {new Date().getFullYear()} {name}. Crafted with care.
  </span>
);

const Footer: React.FC<FooterProps> = ({ name, socials, variant = 'normal' }) => {
  if (variant === 'landing') {
    return (
      <footer className="site-footer site-footer--landing py-4">
        <FooterRobot />
        <div className="container footer-inner">
          {socials.length ? <SocialOrbit items={socials} /> : null}
        </div>
        {/* Credit pinned to the true bottom, clear of the robot + orbit (neon
            glow — see .footer-credit in App.css). */}
        <Credit name={name} />
      </footer>
    );
  }

  // Normal footer: simple social row + credit.
  return (
    <footer className="site-footer py-4">
      <div className="container text-center footer-inner">
        {socials.length ? <SocialBar items={socials} /> : null}
        <Credit name={name} />
      </div>
    </footer>
  );
};

export default Footer;
