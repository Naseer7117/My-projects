import React from 'react';
import { m, useAnimation } from 'framer-motion';
import { prefersReducedMotion } from 'lib/env';

/*
 * MagnetizeParticles — a hover "magnet" particle overlay. At rest, N little
 * accent dots sit scattered around the element; on hover they're ATTRACTED in
 * toward the centre (spring), and on leave they scatter back out. Purely
 * decorative — an absolutely-positioned, pointer-events:none layer meant to sit
 * INSIDE an existing button so it doesn't change the button's markup/behaviour.
 *
 * Adapted from a shadcn/Tailwind/Next `MagnetizeButton` sample: kept only the
 * particle magnet behaviour, dropped the shadcn Button wrapper, the lucide
 * Magnet icon + "Hover me" label, the violet Tailwind classes, and the new deps
 * (framer is already installed). Uses `m.*` (required under <LazyMotion strict>)
 * and site-accent colouring via CSS. The parent controls hover via `attract`;
 * reduced-motion → renders nothing.
 *
 * Scatter range is smaller than the sample's ±180px because these ride tiny nav
 * links, not a big button — particles stay near their tab.
 */

type MagnetizeParticlesProps = {
  /** True while the host is hovered/focused — pulls the particles to centre. */
  attract: boolean;
  particleCount?: number;
  /** Half-spread of the resting scatter, in px. */
  spread?: number;
};

type Particle = { x: number; y: number };

// Memoized: the whole Navbar re-renders when its shared `hovered` state flips on
// any tab, but a tab's particles only need to react when ITS OWN `attract` prop
// changes. Props are primitives, so the default shallow compare is exactly right.
const MagnetizeParticles: React.FC<MagnetizeParticlesProps> = React.memo(({
  attract,
  particleCount = 12,
  spread = 60,
}) => {
  const reduced = prefersReducedMotion();
  const control = useAnimation();
  // Resting scatter positions — generated once per mount.
  const particles = React.useMemo<Particle[]>(
    () =>
      Array.from({ length: particleCount }, () => ({
        x: Math.random() * spread * 2 - spread,
        y: Math.random() * spread * 2 - spread,
      })),
    [particleCount, spread]
  );

  React.useEffect(() => {
    if (reduced) return;
    if (attract) {
      control.start({
        x: 0,
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 50, damping: 10 },
      });
    } else {
      control.start((i: number) => ({
        x: particles[i].x,
        y: particles[i].y,
        opacity: 0.4,
        transition: { type: 'spring', stiffness: 100, damping: 15 },
      }));
    }
  }, [attract, control, particles, reduced]);

  if (reduced) return null;

  return (
    <span className="magnetize-particles" aria-hidden="true">
      {particles.map((pcl, i) => (
        <m.span
          key={i}
          className="magnetize-particles__dot"
          custom={i}
          initial={{ x: pcl.x, y: pcl.y, opacity: 0.4 }}
          animate={control}
        />
      ))}
    </span>
  );
});

MagnetizeParticles.displayName = 'MagnetizeParticles';

export default MagnetizeParticles;
