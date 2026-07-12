import { useEffect } from 'react';
import { hasFinePointer, prefersReducedMotion } from '../../lib/env';
import { DEFAULT_MAGNETIC_STRENGTH } from '../../lib/constants';

/**
 * Make buttons (and any [data-magnetic] element) drift toward the cursor while
 * hovered, snapping back on leave. Skipped on touch / reduced-motion.
 * Returns a cleanup that removes every listener and resets transforms.
 */
function setupMagnetic(): () => void {
  if (!hasFinePointer() || prefersReducedMotion()) return () => undefined;

  const els = Array.from(document.querySelectorAll<HTMLElement>('.btn, [data-magnetic]'));
  const cleanups: Array<() => void> = [];

  els.forEach((el) => {
    const strength = Number(el.dataset.magnetic || DEFAULT_MAGNETIC_STRENGTH);
    // Cache the element's box on enter so pointermove never forces a synchronous
    // layout read (getBoundingClientRect). Writes are rAF-throttled.
    let rect: DOMRect | null = null;
    let raf = 0;
    const onEnter = () => {
      rect = el.getBoundingClientRect();
    };
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      const cx = e.clientX;
      const cy = e.clientY;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!rect) rect = el.getBoundingClientRect();
        const mx = cx - (rect.left + rect.width / 2);
        const my = cy - (rect.top + rect.height / 2);
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      rect = null;
      el.style.transform = '';
    };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Re-attach magnetic handlers whenever the route changes (new buttons mount). */
export function useMagnetic(routeKey: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cleanup: () => void = () => undefined;
    const id = requestAnimationFrame(() => {
      cleanup = setupMagnetic();
    });
    return () => {
      cancelAnimationFrame(id);
      cleanup();
    };
  }, [routeKey]);
}
