import { useEffect } from 'react';
import { hasFinePointer, prefersReducedMotion } from '../../lib/env';
import { lerp, clamp } from '../../lib/math';
import {
  CURSOR_RING_LERP,
  CURSOR_INTERACTIVE_SELECTOR,
  CURSOR_LINK_DIST,
  CURSOR_LINK_ALPHA,
  CURSOR_LINK_RGB,
  CURSOR_PULL_DIST_SQ,
  CURSOR_PULL_FORCE,
  CURSOR_PULL_FACTOR,
  PARTICLE_MAX,
  PARTICLE_AREA_DIVISOR,
  PARTICLE_SPEED,
  PARTICLE_MAX_SPEED,
  PARTICLE_RADIUS_MIN,
  PARTICLE_RADIUS_JITTER,
  PARTICLE_LINK_DIST,
  PARTICLE_LINK_ALPHA,
  PARTICLE_LINK_RGB,
  PARTICLE_FILL,
} from '../../lib/constants';

type Particle = { x: number; y: number; vx: number; vy: number; r: number };
type Pointer = { x: number; y: number; active: boolean };

/*
 * useCursorFx — the pointer-driven background effects, kept in ONE hook because
 * they share a single requestAnimationFrame loop (cheaper than several):
 *   - the cursor spotlight (writes --mx/--my for the stylesheet),
 *   - the custom cursor (a dot that tracks the pointer + a ring that eases behind
 *     it, growing over interactive elements),
 *   - the particle constellation canvas that drifts and reacts to the cursor.
 *
 * All of this is skipped on touch devices and when reduced-motion is requested.
 */
export function useCursorFx(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const cleanups: Array<() => void> = [];
    const pointer: Pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false,
    };

    const fine = hasFinePointer() && !prefersReducedMotion();

    // --- spotlight + shared pointer tracking ---
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
    };
    if (fine) {
      root.classList.add('has-spotlight');
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('pointermove', onPointerMove);
        root.classList.remove('has-spotlight');
      });
    }

    // --- custom cursor ---
    const dot = document.querySelector<HTMLElement>('.cursor-dot');
    const ring = document.querySelector<HTMLElement>('.cursor-ring');
    let rx = pointer.x;
    let ry = pointer.y;
    if (fine && dot && ring) {
      root.classList.add('has-cursor');
      const onOver = (e: Event) => {
        const t = e.target as HTMLElement;
        root.classList.toggle('cursor-active', Boolean(t.closest(CURSOR_INTERACTIVE_SELECTOR)));
        // Over the site brand, the ring becomes a soft background glow instead.
        root.classList.toggle('cursor-brand', Boolean(t.closest('.hero-navbar-brand')));
      };
      const onDown = () => root.classList.add('cursor-down');
      const onUp = () => root.classList.remove('cursor-down');
      document.addEventListener('pointerover', onOver, { passive: true });
      window.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp);
      cleanups.push(() => {
        document.removeEventListener('pointerover', onOver);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        root.classList.remove('has-cursor', 'cursor-active', 'cursor-down', 'cursor-brand');
      });
    }

    // --- particle constellation ---
    const canvas = document.querySelector<HTMLCanvasElement>('.particles');
    const ctx = canvas?.getContext('2d') || null;
    let particles: Particle[] = [];
    let W = 0;
    let H = 0;
    const runParticles = Boolean(canvas && ctx) && !prefersReducedMotion();

    const sizeCanvas = () => {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const count = Math.min(PARTICLE_MAX, Math.round((W * H) / PARTICLE_AREA_DIVISOR));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED,
        r: Math.random() * PARTICLE_RADIUS_JITTER + PARTICLE_RADIUS_MIN,
      }));
    };
    if (runParticles) {
      sizeCanvas();
      window.addEventListener('resize', sizeCanvas);
      cleanups.push(() => window.removeEventListener('resize', sizeCanvas));
    }

    // --- unified animation loop ---
    let rafId = 0;
    const tick = () => {
      if (fine && dot && ring) {
        rx = lerp(rx, pointer.x, CURSOR_RING_LERP);
        ry = lerp(ry, pointer.y, CURSOR_RING_LERP);
        dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }

      if (runParticles && ctx && !document.hidden) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = PARTICLE_FILL; // constant — set once per frame, not per particle

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = W;
          if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H;
          if (p.y > H) p.y = 0;

          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < CURSOR_PULL_DIST_SQ && d2 > 1) {
              const f = CURSOR_PULL_FORCE / Math.sqrt(d2);
              p.vx += dx * f * CURSOR_PULL_FACTOR;
              p.vy += dy * f * CURSOR_PULL_FACTOR;
            }
          }
          p.vx = clamp(p.vx, -PARTICLE_MAX_SPEED, PARTICLE_MAX_SPEED);
          p.vy = clamp(p.vy, -PARTICLE_MAX_SPEED, PARTICLE_MAX_SPEED);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < PARTICLE_LINK_DIST) {
              const alpha = (1 - dist / PARTICLE_LINK_DIST) * PARTICLE_LINK_ALPHA;
              ctx.strokeStyle = `rgba(${PARTICLE_LINK_RGB}, ${alpha})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
          if (pointer.active) {
            const a = particles[i];
            const dx = a.x - pointer.x;
            const dy = a.y - pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CURSOR_LINK_DIST) {
              const alpha = (1 - dist / CURSOR_LINK_DIST) * CURSOR_LINK_ALPHA;
              ctx.strokeStyle = `rgba(${CURSOR_LINK_RGB}, ${alpha})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(pointer.x, pointer.y);
              ctx.stroke();
            }
          }
        }
      }

      if (running) rafId = requestAnimationFrame(tick);
    };

    // Run the loop only while the tab is visible — a backgrounded tab does zero
    // canvas/cursor work instead of burning CPU/GPU/battery.
    let running = false;
    const startLoop = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
    if (fine || runParticles) {
      const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
      document.addEventListener('visibilitychange', onVisibility);
      startLoop();
      cleanups.push(() => {
        document.removeEventListener('visibilitychange', onVisibility);
        stopLoop();
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);
}
