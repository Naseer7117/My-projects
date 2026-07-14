import React from 'react';
import { IntroVariant } from 'components/effects/Intro';
import { useRafProgress } from 'hooks/interactions/useRafProgress';

type PageScanProps = {
  variant: IntroVariant;
  /** Begin the de-scan sweep (App flips this as the intro curtains open). */
  running: boolean;
  /** Fired when the sweep has finished and the overlay can be unmounted. */
  onDone: () => void;
};

/*
 * PageScan — applies the "scanned" look to the REAL page content while it
 * loads. A full-viewport veil renders everything beneath it in a duotone,
 * scan-lined CRT style (via backdrop-filter), so when the intro curtains open
 * the actual website appears as a scan. Then a bright beam sweeps from top to
 * bottom, dragging the veil's top edge with it — content above the beam
 * resolves to its normal colours, and when the beam reaches the bottom the
 * page is fully normal and this overlay unmounts.
 *
 * App only mounts this on the home (index) and contact pages, and only when an
 * intro is playing (so never under prefers-reduced-motion).
 */

const SWEEP_MS = { full: 2400, quick: 1000 } as const;
const START_DELAY_MS = 250; // let the curtains open a touch before sweeping

// easeInOutQuad — slow start, fast middle, gentle landing.
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const PageScan: React.FC<PageScanProps> = ({ variant, running, onDone }) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const duration = SWEEP_MS[variant];

  // The sweep proper only starts after START_DELAY_MS (lets the curtains open
  // a touch first); this gate is what useRafProgress's `active` flag drives.
  const [sweeping, setSweeping] = React.useState(false);
  React.useEffect(() => {
    if (!running) {
      setSweeping(false);
      return;
    }
    const delayId = window.setTimeout(() => setSweeping(true), START_DELAY_MS);
    // Safety net: if rAF stalls (e.g. the tab is hidden mid-sweep), still
    // release the page. onDone is idempotent — App just unmounts us.
    const failsafeId = window.setTimeout(onDone, START_DELAY_MS + duration + 2000);
    return () => {
      window.clearTimeout(delayId);
      window.clearTimeout(failsafeId);
    };
  }, [running, duration, onDone]);

  useRafProgress(
    duration,
    (progress) => {
      rootRef.current?.style.setProperty('--sweep', `${ease(progress) * 100}`);
      if (progress >= 1) onDone();
    },
    sweeping
  );

  return (
    <div className="page-scan" ref={rootRef} aria-hidden="true">
      <div className="page-scan__veil" />
      <div className="page-scan__beam" />
    </div>
  );
};

export default PageScan;
