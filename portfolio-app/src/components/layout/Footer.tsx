import React from 'react';

/* Footer — the site credit line. */

type FooterProps = {
  name: string;
};

const Footer: React.FC<FooterProps> = ({ name }) => (
  <footer className="site-footer py-4">
    <div className="container text-center footer-credit-wrapper">
      <span className="footer-credit">
        &copy; {new Date().getFullYear()} {name}. Crafted with care.
      </span>
    </div>
  </footer>
);

export default Footer;
