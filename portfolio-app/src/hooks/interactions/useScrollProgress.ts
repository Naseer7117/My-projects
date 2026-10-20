import { useEffect } from 'react';
import { NAVBAR_SCROLL_THRESHOLD } from '../../lib/constants';

/*
 * useScrollProgress — drives the top progress bar and the navbar "scrolled"
 * state, plus the aurora's scroll parallax.
 *
 * PERF — two expensive patterns were removed here; please keep both fixes:
 *
 * 1. CSS VARS ARE SET ON THE CONSUMING ELEMENTS, NOT ON :root.
 *    Changing a custom property on document.documentElement invalidates style
 *    for the WHOLE document subtree. With ~1,000 elements on the long-scroll
 *    Home, writing --sp/--sy to :root every scroll frame made
 *    "Recalculate Style" 57.7% of a real DevTools trace (8.2s of 14s) — the
 *    single biggest cost on the site. Only two elements actually read these
 *    vars (.scroll-progress reads --sp, .aurora reads --sy), so we write them
 *    straight onto those nodes and the invalidation stays local.
 *
 * 2. document.body.scrollHeight IS CACHED.
 *    Reading it inside the scroll handler forces a synchronous layout of the
 *    entire ~10,000px page on every frame. It is cached and refreshed by a
 *    ResizeObserver instead — the page grows as sections reveal and GSAP pins
 *    resize their spacers, neither of which fires a resize event, which is why
 *    a naive cache would drift.
 */
export function useScrollProgress(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // The only two consumers of the per-frame vars.
    const bar = document.querySelector<HTMLElement>('.scroll-progress');
    const aurora = document.querySelector<HTMLElement>('.aurora');
    const nav = document.querySelector('.main-navbar');
    let raf = 0;

    let maxScroll = 0;
    const measure = () => {
      maxScroll = document.body.scrollHeight - window.innerHeight;
    };

    // Only touch the DOM when a value actually changes.
    let scrolledState: boolean | null = null;
    let lastProgress = -1;
    let lastY = -1;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (bar) {
        const progress = maxScroll > 0 ? Math.min(1, y / maxScroll) : 0;
        // 3 decimals is well under one pixel of bar width — skipping no-op
        // writes avoids pointless style work when scrolling slowly.
        const p = Math.round(progress * 1000) / 1000;
        if (p !== lastProgress) {
          lastProgress = p;
          bar.style.setProperty('--sp', `${p}`);
        }
      }
      if (aurora && y !== lastY) {
        lastY = y;
        aurora.style.setProperty('--sy', `${y}`);
      }
      if (nav) {
        const next = y > NAVBAR_SCROLL_THRESHOLD;
        if (next !== scrolledState) {
          scrolledState = next;
          nav.classList.toggle('is-scrolled', next);
        }
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
