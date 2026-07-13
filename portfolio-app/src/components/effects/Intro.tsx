import React from 'react';
import { portfolioData } from 'content/portfolio';

export type IntroVariant = 'full' | 'quick';

type IntroProps = {
  /** 'full' = first load of the session; 'quick' = a faster repeat version. */
  variant?: IntroVariant;
  /** Fired when the exit (curtain-split) animation begins. */
  onExitStart?: () => void;
  /** Fired when the intro has fully finished and can be unmounted. */
  onDone: () => void;
};

/*
 * Intro — the full-screen brand loading view: "> Naseeruddin Shaik", role, and
 * a progress bar running 0 → 100%. When it completes, two panels split apart
 * to reveal the site. On home/contact the revealed content starts out
 * "scanned" and is resolved by the PageScan effect (see PageScan.tsx) — App
 * wires the two together.
 *
 * The FULL version plays once per browser session; later reloads get the quick
 * version (App decides via sessionStorage). Never rendered under
 * prefers-reduced-motion.
 */

const TIMINGS = {
  full: { loadMs: 1800, holdMs: 200 },
  quick: { loadMs: 600, holdMs: 120 },
} as const;
const EXIT_MS = 850; // curtain split

const { hero } = portfolioData;

const Intro: React.FC<IntroProps> = ({ variant = 'full', onExitStart, onDone }) => {
  const [count, setCount] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const { loadMs, holdMs } = TIMINGS[variant];

  React.useEffect(() => {
    let rafId = 0;
    let holdId = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / loadMs);
      setCount(Math.round(progress * 100));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        holdId = window.setTimeout(() => setExiting(true), holdMs);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(holdId);
    };
  }, [loadMs, holdMs]);

  React.useEffect(() => {
    if (!exiting) return;
    onExitStart?.();
    const doneId = window.setTimeout(onDone, EXIT_MS);
    return () => window.clearTimeout(doneId);
  }, [exiting, onExitStart, onDone]);

  return (
    <div
      className={`intro intro--${variant}${exiting ? ' intro--exit' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="intro__panel intro__panel--top" />
      <div className="intro__panel intro__panel--bottom" />
      <div className="intro__content">
        <div className="intro__brand">
          <span className="intro__caret">&gt;</span> {hero.name}
        </div>
        <div className="intro__role">{hero.role}</div>
        <div className="intro__bar">
          <span className="intro__bar-fill" style={{ width: `${count}%` }} />
        </div>
        <div className="intro__count">{count}%</div>
      </div>
    </div>
  );
};

export default Intro;
