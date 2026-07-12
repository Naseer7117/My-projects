import { useEffect } from 'react';
import { NAVBAR_SCROLL_THRESHOLD } from '../../lib/constants';

/*
 * useScrollProgress — drives the top progress bar and the navbar "scrolled"
 * state. Writes CSS variables the stylesheet reads:
 *   --sp : scroll progress 0..1 (scaleX of the progress bar)
 *   --sy : raw scrollY (used for the aurora parallax)
 * and toggles `.is-scrolled` on the navbar. rAF-throttled so it runs at most
 * once per frame.
 */
export function useScrollProgress(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.body.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        root.style.setProperty('--sp', `${progress}`);
        root.style.setProperty('--sy', `${window.scrollY}`);
        const nav = document.querySelector('.main-navbar');
        if (nav) {
          nav.classList.toggle('is-scrolled', window.scrollY > NAVBAR_SCROLL_THRESHOLD);
        }
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
