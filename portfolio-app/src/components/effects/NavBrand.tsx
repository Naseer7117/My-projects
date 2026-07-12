import React from 'react';
import { prefersReducedMotion } from 'lib/env';

/*
 * NavBrand.tsx — the "> Naseeruddin Shaik" logo in the navbar.
 *
 * On hover it plays a TEXT-SCRAMBLE / DECODE effect: the letters flicker through
 * random characters and resolve left-to-right into the real name, like a
 * terminal decoding. The glow / gradient / underline styling lives in App.css
 * (the .hero-navbar-brand rules); this component only drives the text itself.
 *
 * Because the font is monospace, every character is the same width, so the text
 * never shifts while it scrambles.
 */

// Characters the name flickers through while decoding.
const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#§$%&';
const DURATION_MS = 650;

type NavBrandProps = {
  name: string;
  onClick: () => void;
};

const NavBrand: React.FC<NavBrandProps> = ({ name, onClick }) => {
  const [display, setDisplay] = React.useState(name);
  const frameRef = React.useRef<number | null>(null);
  const reducedRef = React.useRef(false);

  React.useEffect(() => {
    reducedRef.current = prefersReducedMotion();
    // Clean up any running animation if the component unmounts.
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const scramble = React.useCallback(() => {
    if (reducedRef.current) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const total = name.length;
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / DURATION_MS);
      const revealed = Math.floor(progress * total);

      let out = '';
      for (let i = 0; i < total; i++) {
        const ch = name[i];
        if (ch === ' ') {
          out += ' ';
        } else if (i < revealed) {
          out += ch; // this character has resolved
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setDisplay(out);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(name); // ensure we finish on the exact name
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
  }, [name]);

  return (
    <button type="button" className="hero-navbar-brand" onClick={onClick} onMouseEnter={scramble}>
      <span className="hero-navbar-brand__caret" aria-hidden="true">&gt;</span>
      <span className="hero-navbar-brand__name">{display}</span>
    </button>
  );
};

export default NavBrand;
