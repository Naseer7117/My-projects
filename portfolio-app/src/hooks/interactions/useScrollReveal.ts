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

/** Animate a [data-count] element from 0 up to its target when it reveals. */
function animateCount(el: HTMLElement): void {
  const target = Number(el.dataset.count || '0');
  const suffix = el.dataset.suffix || '';
  if (prefersReducedMotion()) {
    el.textContent = `${target}${suffix}`;
    return;
  }
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const p = Math.min(1, (ts - start) / COUNT_DURATION_MS);
    el.textContent = `${Math.round(easeOutQuart(p) * target)}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Observe every [data-reveal] element and add `is-in` (which the CSS animates)
 * when it scrolls into view. Elements sharing a parent get a staggered delay via
 * the --rd custom property so grids cascade. Returns a cleanup.
 */
function setupReveal(): () => void {
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reveal]')
  ).filter((el) => !el.classList.contains('is-in'));

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
    el.querySelectorAll<HTMLElement>('[data-count]').forEach(animateCount);
    if (el.hasAttribute('data-count')) animateCount(el);
  };

  // Fallback for very old browsers: reveal everything immediately.
  if (!('IntersectionObserver' in window)) {
    targets.forEach(reveal);
    return () => undefined;
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
  targets.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

/**
 * Re-scan the DOM for reveal targets whenever the route changes (the new page
 * has just mounted). Deferred one frame so the page has painted first.
 */
export function useScrollReveal(routeKey: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cleanup: () => void = () => undefined;
    const id = requestAnimationFrame(() => {
      cleanup = setupReveal();
    });
    return () => {
      cancelAnimationFrame(id);
      cleanup();
    };
  }, [routeKey]);
}
