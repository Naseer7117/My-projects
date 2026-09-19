import React from 'react';
import { m, useSpring, useTransform } from 'framer-motion';
import SplineScene from 'components/effects/SplineScene';
import { prefersReducedMotion, isLowPowerDevice } from 'lib/env';

/*
 * FooterRobot — the Spline 3D robot BLENDED into the footer (no card, no text,
 * no box). A transparent, absolutely-positioned background layer filling the
 * footer; the social orbit + credit sit ON TOP of it.
 *
 * "Look toward the mouse": a framer-motion PARALLAX — the robot container
 * shifts/tilts a few px/deg toward the pointer as it moves over the footer.
 *
 * Heavy WebGL from Spline's CDN is GATED: skipped on phones (narrow viewport /
 * no fine pointer), under reduced-motion, and on Save-Data (renders nothing —
 * footer just shows the orbit). The gate is RE-EVALUATED on resize, so shrinking
 * the window to a phone width unmounts the ~4MB WebGL canvas. Load/chunk
 * failures can't crash the app: SplineScene wraps the scene in an ErrorBoundary
 * (fallback null), so a CDN/offline failure just renders nothing.
 */

const SPLINE_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';
const SHIFT_PX = 22; // max horizontal/vertical drift toward the cursor
const TILT_DEG = 6; // max tilt toward the cursor

/** Whether to load the heavy WebGL robot right now. Now runs on MOBILE too (the
 * owner wants the same landing on phones) — but STAYS SAFE: skipped under
 * reduced-motion, Save-Data, or on genuinely low-power devices (≤4 cores/RAM),
 * so the ~4MB WebGL never loads on the weakest phones where it would stutter. On
 * touch the mouse-parallax simply no-ops; the rigged scene still displays. */
const shouldLoadRobot = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (prefersReducedMotion()) return false;
  if (isLowPowerDevice()) return false; // no heavy WebGL on weak phones/PCs
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
};

type FooterRobotProps = {
  /** True once the footer has scrolled into view. Gates the ~4MB WebGL load so
   * it only happens when the visitor actually reaches the footer, not on Home
   * mount. */
  inView?: boolean;
};

const FooterRobot: React.FC<FooterRobotProps> = ({ inView = true }) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const reduced = prefersReducedMotion();
  const [heavy, setHeavy] = React.useState(shouldLoadRobot);
  // Latch: once the footer has been seen, keep the robot mounted. Prevents the
  // WebGL context from being torn down + rebuilt as the footer scrolls in and
  // out of view (that churn was a memory-leak source).
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);

  // Re-evaluate on resize so resizing DESKTOP→phone width unmounts the WebGL
  // canvas (and phone→desktop can bring it in). Debounced with rAF.
  React.useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setHeavy(shouldLoadRobot()));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Pointer position normalized to [-1, 1] from the footer centre, spring-smoothed.
  const nx = useSpring(0, { stiffness: 90, damping: 18, mass: 0.6 });
  const ny = useSpring(0, { stiffness: 90, damping: 18, mass: 0.6 });
  const x = useTransform(nx, (v) => v * SHIFT_PX);
  const y = useTransform(ny, (v) => v * SHIFT_PX);
  const rotateY = useTransform(nx, (v) => v * TILT_DEG); // turn toward cursor L/R
  const rotateX = useTransform(ny, (v) => -v * TILT_DEG); // tip up/down toward cursor

  React.useEffect(() => {
    if (!heavy || reduced) return;
    const host = hostRef.current;
    if (!host) return;
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      nx.set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)));
      ny.set(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)));
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [heavy, reduced, nx, ny]);

  if (!heavy || !seen) return null; // wait until the footer is reached before loading WebGL

  return (
    <m.div
      ref={hostRef}
      className="footer-robot"
      aria-hidden="true"
      style={{ x, y, rotateX, rotateY }}
    >
      <SplineScene scene={SPLINE_SCENE} className="footer-robot__spline" />
    </m.div>
  );
};

export default FooterRobot;
