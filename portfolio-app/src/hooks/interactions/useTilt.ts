import { hasFinePointer, prefersReducedMotion } from '../../lib/env';
import { DEFAULT_TILT_DEG } from '../../lib/constants';
import { useElementEffect } from './useElementEffect';

/**
 * Attach a 3D "lean toward the cursor" effect to every [data-tilt] element.
 * Writes --tx/--ty (rotation) and --gx/--gy (a moving highlight) that the CSS
 * turns into a perspective transform. Skipped on touch / reduced-motion.
 * Returns a cleanup that removes every listener.
 */
function setupTilt(): () => void {
  if (!hasFinePointer() || prefersReducedMotion()) return () => undefined;

  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
  const cleanups: Array<() => void> = [];

  cards.forEach((card) => {
    // Cache the box on enter so pointermove never forces a synchronous layout
    // read: the rAF writes --tx/--ty/--gx/--gy which dirty layout/paint, so
    // reading getBoundingClientRect() the next frame would flush that back (a
    // read-after-write thrash, per card, per frame). Mirrors useMagnetic.
    let rect: DOMRect | null = null;
    let raf = 0;
    const onEnter = () => {
      rect = card.getBoundingClientRect();
      card.style.willChange = 'transform'; // promote only while tilting
    };
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      const cx = e.clientX;
      const cy = e.clientY;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!rect) rect = card.getBoundingClientRect(); // fallback: move before enter
        const px = (cx - rect.left) / rect.width - 0.5;
        const py = (cy - rect.top) / rect.height - 0.5;
        const max = Number(card.dataset.tilt || DEFAULT_TILT_DEG);
        card.style.setProperty('--ty', `${px * max}deg`);
        card.style.setProperty('--tx', `${-py * max}deg`);
        card.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
        card.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
      });
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      rect = null;
      card.style.setProperty('--tx', '0deg');
      card.style.setProperty('--ty', '0deg');
      card.style.willChange = 'auto'; // release the promotion once settled
    };
    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      card.style.willChange = 'auto';
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Re-attach tilt handlers whenever the route changes (new cards mount). */
export function useTilt(routeKey: string): void {
  useElementEffect(routeKey, setupTilt);
}
