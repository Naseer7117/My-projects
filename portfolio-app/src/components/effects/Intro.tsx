import React from 'react';

type IntroProps = {
  /** Fired when the exit (curtain-split) animation begins. */
  onExitStart?: () => void;
  /** Fired when the intro has fully finished and can be unmounted. */
  onDone: () => void;
};

const LOAD_MS = 1900; // counter 0 -> 100
const HOLD_MS = 220; // brief pause at 100%
const EXIT_MS = 850; // curtain split

/**
 * Full-screen intro loader. A brand mark + progress counter animate in, the
 * counter runs to 100%, then two panels split apart to reveal the site.
 * Only rendered on the first visit of a session, and never under
 * prefers-reduced-motion (that decision lives in App).
 */
const Intro: React.FC<IntroProps> = ({ onExitStart, onDone }) => {
  const [count, setCount] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    let rafId = 0;
    let holdId = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / LOAD_MS);
      // ease-out so it decelerates toward 100
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * 100));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        holdId = window.setTimeout(() => setExiting(true), HOLD_MS);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(holdId);
    };
  }, []);

  React.useEffect(() => {
    if (!exiting) return;
    onExitStart?.();
    const doneId = window.setTimeout(onDone, EXIT_MS);
    return () => window.clearTimeout(doneId);
  }, [exiting, onExitStart, onDone]);

  return (
    <div className={`intro${exiting ? ' intro--exit' : ''}`} role="presentation" aria-hidden="true">
      <div className="intro__panel intro__panel--top" />
      <div className="intro__panel intro__panel--bottom" />
      <div className="intro__content">
        <div className="intro__brand">
          <span className="intro__caret">&gt;</span> Naseeruddin&nbsp;Shaik
        </div>
        <div className="intro__role">Software Engineer</div>
        <div className="intro__bar">
          <span className="intro__bar-fill" style={{ width: `${count}%` }} />
        </div>
        <div className="intro__count">{count}%</div>
      </div>
    </div>
  );
};

export default Intro;
