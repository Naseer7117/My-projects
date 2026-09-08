import React from 'react';

/*
 * FloatingPaths — slow-drifting background line-work: a fan of long curved SVG
 * strokes whose dash pattern continuously slides along each path, so the lines
 * appear to flow across the area. Two mirrored fans (position ±1) cross for a
 * woven look.
 *
 * Adapted from a shadcn/Tailwind/Next + framer-motion sample to THIS stack (CRA
 * + plain CSS, LazyMotion strict): dropped 'use client', the Tailwind wrapper,
 * the title/letter animation and the shadcn Button (we only want the moving
 * lines as a background layer). The drift is driven by a PLAIN CSS keyframe on
 * `stroke-dashoffset` rather than framer's `m.path` pathLength/pathOffset — our
 * `<LazyMotion features={domAnimation}>` does NOT include the SVG path-drawing
 * feature, so `m.path` renders static; CSS animates it natively with zero bundle
 * cost. `pathLength="1"` normalises every path's length to 1 unit so one dash
 * pattern + one keyframe works for all of them. Colour is `currentColor` (set to
 * the site accent on the wrapper). Decorative, pointer-events:none; the wrapper's
 * reduced-motion CSS hides it.
 *
 * Each path gets a slightly different animation-duration (staggered by index) so
 * the lines drift at varied speeds instead of marching in lockstep.
 *
 * PERF: 18 lines per fan (36 total), down from the sample's 36/fan (72). Animated
 * SVG `stroke-dashoffset` isn't GPU-composited, so each line costs a re-render
 * every frame — halving the count roughly halves that cost with no visible loss
 * (the woven look is identical). Index math is ×2 (`i * 2`) so the fan spans the
 * same spread with fewer, evenly-spaced strokes.
 */

type FanProps = { position: number };

const LINES_PER_FAN = 18;

const Fan: React.FC<FanProps> = ({ position }) => {
  const paths = Array.from({ length: LINES_PER_FAN }, (_, idx) => {
    const i = idx * 2; // keep the original 0..36 spread with half the lines
    return {
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${
        312 - i * 5 * position
      } ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
    };
  });

  return (
    <svg
      className="floating-paths__svg"
      viewBox="0 0 696 316"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {paths.map((path) => (
        <path
          key={path.id}
          className="floating-paths__line"
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={0.1 + path.id * 0.03}
          pathLength={1}
          // vary drift speed per line (20–35s), and flip direction on the
          // mirrored fan so the two weaves flow opposite ways
          style={
            {
              '--fp-dur': `${20 + (path.id % 12) * 1.25}s`,
              '--fp-dir': position > 0 ? 'normal' : 'reverse',
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
};

const FloatingPaths: React.FC = () => (
  <div className="floating-paths" aria-hidden="true">
    <Fan position={1} />
    <Fan position={-1} />
  </div>
);

export default FloatingPaths;
