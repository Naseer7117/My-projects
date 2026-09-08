import React from 'react';
import { prefersReducedMotion } from 'lib/env';

/*
 * FooterGlow — a U-shaped gradient glow spread across the WHOLE bottom of the
 * landing footer, with a breathing (slow expand/contract) effect.
 *
 * The "U curve" is a very WIDE, SHORT elliptical radial gradient anchored below
 * the footer's bottom-centre: the coloured band (blue → orange → pink) arcs up
 * at the left and right edges and dips in the middle, reading as a U / valley
 * that hugs the footer floor. A rAF loop eases the ellipse's radius so the whole
 * glow breathes. Deepest footer layer, decorative, pointer-events:none.
 * Reduced-motion → a static U (no rAF).
 */

const FooterGlow: React.FC = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Colour stops of the U band (rise from the bottom, fade out at the arc top).
    const stops = [
      'rgba(10, 11, 20, 0) 0%',
      'rgba(41, 121, 255, 0.42) 34%',
      'rgba(255, 109, 0, 0.5) 55%',
      'rgba(255, 47, 146, 0.4) 72%',
      'rgba(10, 11, 20, 0) 100%',
    ].join(', ');

    // Wide + short ellipse anchored at the bottom centre → a broad U across the
    // whole floor. baseW is the horizontal radius (%), baseH the vertical.
    const baseW = 90;
    const baseH = 62;
    const paint = (w: number, h: number) => {
      el.style.background = `radial-gradient(${w}% ${h}% at 50% 118%, ${stops})`;
    };

    if (prefersReducedMotion()) {
      paint(baseW, baseH);
      return;
    }

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.012;
      // breathe: the U gently widens/narrows and rises/falls
      const w = baseW + Math.sin(t) * 6;
      const h = baseH + Math.sin(t) * 5;
      paint(w, h);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="footer-glow" aria-hidden="true">
      <div ref={ref} className="footer-glow__layer" />
    </div>
  );
};

export default FooterGlow;
