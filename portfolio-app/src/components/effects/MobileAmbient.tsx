import React from 'react';
import { prefersReducedMotion, hasFinePointer, isLowPowerDevice } from 'lib/env';

/*
 * MobileAmbient — a lightweight, CURSOR-FREE constellation mesh for the mobile
 * background. The desktop ConstellationGrid is cursor-driven (shockwaves) and
 * heavy; phones have no cursor and less budget, so this is a purpose-built
 * cheaper cousin: sparse nodes that DRIFT on their own gentle sine paths (no
 * per-frame pointer math, no O(n²) shockwave), connected to near neighbours.
 * A TAP fires an expanding ripple that briefly pushes nearby nodes — the touch
 * equivalent of the desktop's cursor interaction.
 *
 * Mounted full-screen as the deepest mobile background layer (in BackgroundFx),
 * behind all content. Renders NOTHING on desktop (the real constellation runs
 * there), on reduced-motion, or when the tab is hidden. DPR-capped, node count
 * scaled to viewport, extra-sparse on low-power devices — cheap enough to hold
 * 60fps on a mid phone.
 */

const MobileAmbient: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) return;
    // Desktop (fine pointer + wide) already has the real constellation; this is
    // the mobile/touch stand-in only.
    if (hasFinePointer() && window.innerWidth > 900) return;
    // Skip on LOW-POWER devices: even this sparse canvas rAF tanks FPS on a
    // software-GPU / ≤4-core phone (measured). The aurora + CSS gradients keep
    // the atmosphere there without a per-frame canvas.
    if (isLowPowerDevice()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const lowPower = isLowPowerDevice();

    // read the accent as "r, g, b" once for theming
    const rootStyle = getComputedStyle(document.documentElement);
    const toTriplet = (val: string, fallback: string): string => {
      const v = val.trim();
      const hex = v.match(/^#([0-9a-f]{6})$/i);
      if (hex) {
        const n = parseInt(hex[1], 16);
        return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      }
      const rgb = v.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      return rgb ? `${rgb[1]}, ${rgb[2]}, ${rgb[3]}` : fallback;
    };
    const accent = toTriplet(rootStyle.getPropertyValue('--accent'), '139, 123, 255');
    const dim = toTriplet(rootStyle.getPropertyValue('--text'), '234, 240, 251');

    type Node = {
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      vx: number; // ripple-induced velocity (decays)
      vy: number;
      phase: number; // own drift phase
      ampX: number;
      ampY: number;
      speed: number;
      r: number;
    };
    let nodes: Node[] = [];
    const ripples: { x: number; y: number; t: number }[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      // node density scales with area; sparser on low-power
      const area = width * height;
      const per = lowPower ? 42000 : 26000;
      const count = Math.max(14, Math.min(46, Math.round(area / per)));
      nodes = Array.from({ length: count }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          baseX: x,
          baseY: y,
          x,
          y,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
          ampX: rand(6, 18),
          ampY: rand(6, 18),
          speed: rand(0.15, 0.4),
          r: rand(1.1, 2.2),
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const LINK = 96;
    const LINK_SQ = LINK * LINK;

    let last = performance.now();
    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);

      // advance ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += dt;
        if (ripples[i].t > 1.2) ripples.splice(i, 1);
      }

      // update nodes: gentle self-drift + ripple push + spring home
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.phase += n.speed * dt;
        const driftX = Math.sin(n.phase) * n.ampX;
        const driftY = Math.cos(n.phase * 0.9) * n.ampY;
        // ripple influence
        for (let r = 0; r < ripples.length; r++) {
          const rp = ripples[r];
          const radius = rp.t * 420;
          const dx = n.x - rp.x;
          const dy = n.y - rp.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(d - radius);
          if (band < 60) {
            const force = (1 - band / 60) * (1 - rp.t / 1.2) * 60;
            n.vx += (dx / d) * force * dt;
            n.vy += (dy / d) * force * dt;
          }
        }
        n.vx *= 0.9;
        n.vy *= 0.9;
        const homeX = n.baseX + driftX;
        const homeY = n.baseY + driftY;
        n.x += (homeX - n.x) * 0.08 + n.vx;
        n.y += (homeY - n.y) * 0.08 + n.vy;
      }

      // connections (near neighbours) — vary alpha via globalAlpha, no per-edge string
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = `rgb(${dim})`;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_SQ) {
            const dist = Math.sqrt(d2);
            ctx.globalAlpha = (1 - dist / LINK) * 0.14;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const moving = Math.abs(n.vx) + Math.abs(n.vy) > 0.4;
        ctx.fillStyle = moving ? `rgba(${accent}, 0.9)` : `rgba(${dim}, 0.5)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, moving ? n.r * 1.6 : n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ripple ring
      for (let r = 0; r < ripples.length; r++) {
        const rp = ripples[r];
        ctx.strokeStyle = `rgba(${accent}, ${(1 - rp.t / 1.2) * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.t * 420, 0, Math.PI * 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0] || e.changedTouches[0];
      if (t) ripples.push({ x: t.clientX, y: t.clientY, t: 0 });
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(render);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('touchstart', onTouch, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('touchstart', onTouch);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="mobile-ambient" aria-hidden="true" />;
};

export default MobileAmbient;
