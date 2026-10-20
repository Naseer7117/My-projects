import { useEffect } from 'react';
import { prefersReducedMotion } from '../../lib/env';
import { easeOutQuart } from '../../lib/math';
import {
  COUNT_DURATION_MS,
  REVEAL_STAGGER_STEP_MS,
  REVEAL_STAGGER_MAX_STEPS,
  REVEAL_THRESHOLD,
  REVEAL_ROOT_MARGIN,
} from '../../lib/constants';

/** Animate a [data-count] element from 0 up to its target when it reveals.
 * `live` tracks the in-flight rAF id so setupReveal's cleanup can cancel a
 * count-up that's still running when the route unmounts — otherwise the
 * self-rescheduling step() closure is orphaned (retaining el/target and leaking
 * across navigations). Finished counters need no cleanup (they already stopped). */
function animateCount(el: HTMLElement, live: Set<number>): void {
  const target = Number(el.dataset.count || '0');
  const suffix = el.dataset.suffix || '';
  if (prefersReducedMotion()) {
    el.textContent = `${target}${suffix}`;
    return;
  }
  let start: number | null = null;
  let raf = 0;
  const step = (ts: number) => {
    live.delete(raf);
    if (start === null) start = ts;
    const p = Math.min(1, (ts - start) / COUNT_DURATION_MS);
    el.textContent = `${Math.round(easeOutQuart(p) * target)}${suffix}`;
    if (p < 1) {
      raf = requestAnimationFrame(step);
      live.add(raf);
    }
  };
  raf = requestAnimationFrame(step);
  live.add(raf);
}

/**
 * Observe every [data-reveal] element and add `is-in` (which the CSS animates)
 * when it scrolls into view. Elements sharing a parent get a staggered delay via
 * the --rd custom property so grids cascade. Returns a cleanup.
 */
function setupReveal(): () => void {
  const live = new Set<number>(); // in-flight count-up rAF ids, cancelled on cleanup
  // Skip elements already revealed OR already wired by an earlier pass — the hook
  // runs several passes to survive the navigation race, and this keeps re-runs
  // idempotent (no element observed/count-up'd twice).
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reveal]')
  ).filter((el) => !el.classList.contains('is-in') && el.dataset.revealWired !== '1');

  const groupCounter = new Map<Element, number>();
  targets.forEach((el) => {
    const parent = el.parentElement || document.body;
    const idx = groupCounter.get(parent) ?? 0;
    groupCounter.set(parent, idx + 1);
    if (!el.style.getPropertyValue('--rd')) {
      const steps = Math.min(idx, REVEAL_STAGGER_MAX_STEPS);
      el.style.setProperty('--rd', `${steps * REVEAL_STAGGER_STEP_MS}ms`);
    }
  });

  const reveal = (el: HTMLElement) => {
    el.classList.add('is-in');
    el.querySelectorAll<HTMLElement>('[data-count]').forEach((n) => animateCount(n, live));
    if (el.hasAttribute('data-count')) animateCount(el, live);
  };

  // Fallback for very old browsers: reveal everything immediately.
  if (!('IntersectionObserver' in window)) {
    targets.forEach(reveal);
    return () => {
      live.forEach(cancelAnimationFrame);
      live.clear();
    };
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target as HTMLElement);
        obs.unobserve(entry.target);
      });
    },
    { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
  );

  // Reveal anything ALREADY in the viewport right now, synchronously. On a
  // client-side navigation the new page mounts with its above-the-fold content
  // already on screen; the IntersectionObserver's first callback can be missed
  // in that mount/scroll race (observed: content stuck at opacity:0 until a
  // reload). A direct rect check guarantees on-screen content reveals; the
  // observer still handles everything that scrolls in later.
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const claimed: HTMLElement[] = [];
  targets.forEach((el) => {
    const r = el.getBoundingClientRect();
    const visible = r.top < vh * 0.92 && r.bottom > 0; // matches the -8% rootMargin intent
    if (visible && r.height > 0) {
      reveal(el);
    } else {
      el.dataset.revealWired = '1'; // claim it so later passes don't double-observe
      claimed.push(el);
      observer.observe(el);
    }
  });
  return () => {
    observer.disconnect();
    // release any still-unrevealed claims so a later pass / remount can re-wire them
    claimed.forEach((el) => {
      if (!el.classList.contains('is-in')) delete el.dataset.revealWired;
    });
    live.forEach(cancelAnimationFrame); // stop any count-up still running at unmount
    live.clear();
  };
}

/**
 * Re-scan the DOM for reveal targets whenever the route changes (the new page
 * has just mounted). Deferred one frame so the page has painted first.
 */
export function useScrollReveal(routeKey: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // setupReveal() only observes the [data-reveal] elements present WHEN IT RUNS
    // and each observer instance is single-shot (unobserves on reveal). On a
    // client-side navigation the new page's DOM is not reliably in place at the
    // first frame — the scan overlay + smooth-scroll-to-top + React's commit can
    // land the new content a beat later, so a single pass observed the OUTGOING
    // page's stale nodes and the new page's content stayed hidden until a reload.
    //
    // Fix: run setupReveal on a few staggered passes so whichever pass catches
    // the settled DOM wires up the reveals. Each pass reveals on-screen content
    // immediately (rect check inside setupReveal) and observes the rest; passes
    // skip already-revealed / already-observed nodes, so re-running is cheap and
    // idempotent.
    const cleanups: Array<() => void> = [];
    const timers: number[] = [];
    const runPass = () => cleanups.push(setupReveal());

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(runPass); // after first paint
    });
    // Extra passes to survive the navigation/scan/scroll race above.
    timers.push(window.setTimeout(runPass, 120));
    timers.push(window.setTimeout(runPass, 360));
    timers.push(window.setTimeout(runPass, 700));

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      timers.forEach(clearTimeout);
      cleanups.forEach((fn) => fn());
    };
  }, [routeKey]);
}
