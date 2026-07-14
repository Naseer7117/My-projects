import React from 'react';
import { SocialMedia } from 'types';
import SocialBar from 'components/layout/SocialBar';

/* Footer — social icon buttons + the site credit line. */

type FooterProps = {
  name: string;
  socials: SocialMedia[];
};

const Footer: React.FC<FooterProps> = ({ name, socials }) => (
  <footer className="site-footer py-4">
    <div className="container text-center footer-inner">
      {socials.length ? <SocialBar items={socials} /> : null}
      <span className="footer-credit">
        &copy; {new Date().getFullYear()} {name}. Crafted with care.
      </span>
    </div>
  </footer>
);

export default Footer;
