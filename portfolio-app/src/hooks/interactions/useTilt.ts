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
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
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
      card.style.setProperty('--tx', '0deg');
      card.style.setProperty('--ty', '0deg');
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Re-attach tilt handlers whenever the route changes (new cards mount). */
export function useTilt(routeKey: string): void {
  useElementEffect(routeKey, setupTilt);
}
