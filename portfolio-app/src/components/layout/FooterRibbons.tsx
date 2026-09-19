import React from 'react';
import { canRunHeavyDesktopFx } from 'lib/env';

/*
 * FooterRibbons — flowing neon ribbon-trails that chase the cursor, as the
 * background of the landing footer (behind the robot + orbit). Springy
 * multi-node "lines" trail the pointer and paint additively so overlaps glow.
 *
 * Adapted from a shadcn/Tailwind/Next canvas sample to THIS stack (CRA + plain
 * CSS): the original was a pile of module-level globals + `@ts-ignore` +
 * `document.getElementById("canvas")` sized to the whole window — fragile under
 * StrictMode / multiple mounts. Rewritten as a self-contained component: all
 * state lives in the effect, the canvas is sized to its PARENT (the footer) via
 * the host rect, and the cursor is read in the footer's LOCAL space so the
 * trails live in the footer only. Dropped the demo Hero/Button/dicons/next deps.
 *
 * Themed to the site accent (hue oscillates around --accent's hue for a subtle
 * neon shift). Desktop + fine-pointer only, reduced-motion → renders nothing,
 * and the rAF pauses when the footer is off-screen (perf, like the rest of the
 * site). pointer-events:none so it never blocks the orbit links.
 */

type FooterRibbonsProps = {
  /** rAF runs only while the footer is on screen. */
  active?: boolean;
};

const enabled = (): boolean => canRunHeavyDesktopFx();

const FooterRibbons: React.FC<FooterRibbonsProps> = ({ active = true }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!enabled() || !active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.parentElement;
    if (!host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ---- config (from the sample; friction/tension/dampening tuned as-is) ----
    const CFG = { friction: 0.5, trails: 40, size: 40, dampening: 0.025, tension: 0.99 };

    // Base hue from the site accent so the trails match the theme.
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    let baseHue = 265; // fallback (violet)
    const hexHsl = accent.match(/^#([0-9a-f]{6})$/i);
    if (hexHsl) {
      const num = parseInt(hexHsl[1], 16);
      const r = ((num >> 16) & 255) / 255;
      const g = ((num >> 8) & 255) / 255;
      const b = (num & 255) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      if (d !== 0) {
        let h = 0;
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        baseHue = Math.round(((h * 60) % 360 + 360) % 360);
      }
    }

    let running = true;
    let raf = 0;
    const pos = { x: 0, y: 0 };
    let ready = false; // no drawing until the cursor has been inside the footer

    type Node = { x: number; y: number; vx: number; vy: number };
    type Line = { spring: number; friction: number; nodes: Node[] };
    let lines: Line[] = [];

    const makeLines = () => {
      lines = [];
      for (let i = 0; i < CFG.trails; i++) {
        const spring = 0.45 + (i / CFG.trails) * 0.025 + 0.1 * Math.random() - 0.05;
        const friction = CFG.friction + 0.01 * Math.random() - 0.005;
        const nodes: Node[] = [];
        for (let j = 0; j < CFG.size; j++) nodes.push({ x: pos.x, y: pos.y, vx: 0, vy: 0 });
        lines.push({ spring, friction, nodes });
      }
    };

    // Cached footer size — clearRect only needs w/h, which change on resize, not
    // per frame. Reading getBoundingClientRect() in render() forced a layout
    // flush every frame; resize() is the only place these can change.
    let hostW = 0;
    let hostH = 0;
    const resize = () => {
      const r = host.getBoundingClientRect();
      hostW = r.width;
      hostH = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // hue oscillator (subtle drift around the accent hue)
    let phase = Math.random() * Math.PI * 2;

    const updateLine = (line: Line) => {
      let e = line.spring;
      let t = line.nodes[0];
      t.vx += (pos.x - t.x) * e;
      t.vy += (pos.y - t.y) * e;
      for (let i = 0; i < line.nodes.length; i++) {
        t = line.nodes[i];
        if (i > 0) {
          const n = line.nodes[i - 1];
          t.vx += (n.x - t.x) * e;
          t.vy += (n.y - t.y) * e;
          t.vx += n.vx * CFG.dampening;
          t.vy += n.vy * CFG.dampening;
        }
        t.vx *= line.friction;
        t.vy *= line.friction;
        t.x += t.vx;
        t.y += t.vy;
        e *= CFG.tension;
      }
    };

    const drawLine = (line: Line) => {
      let n = line.nodes[0].x;
      let iy = line.nodes[0].y;
      ctx.beginPath();
      ctx.moveTo(n, iy);
      let a = 1;
      const o = line.nodes.length - 2;
      for (; a < o; a++) {
        const e = line.nodes[a];
        const t = line.nodes[a + 1];
        n = 0.5 * (e.x + t.x);
        iy = 0.5 * (e.y + t.y);
        ctx.quadraticCurveTo(e.x, e.y, n, iy);
      }
      const e = line.nodes[a];
      const t = line.nodes[a + 1];
      ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
      ctx.stroke();
      ctx.closePath();
    };

    const render = () => {
      if (!running) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, hostW, hostH);
      if (ready) {
        ctx.globalCompositeOperation = 'lighter';
        phase += 0.0015;
        const hue = Math.round(baseHue + Math.sin(phase) * 40);
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.025)`;
        ctx.lineWidth = 10;
        for (let i = 0; i < lines.length; i++) {
          updateLine(lines[i]);
          drawLine(lines[i]);
        }
      }
      raf = window.requestAnimationFrame(render);
    };

    const onMove = (ev: MouseEvent) => {
      const r = host.getBoundingClientRect();
      // only track while the pointer is over the footer
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
      pos.x = ev.clientX - r.left;
      pos.y = ev.clientY - r.top;
      if (!ready) {
        ready = true;
        makeLines(); // seed all nodes at the entry point (no snap from 0,0)
      }
    };

    resize();
    makeLines();
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', resize);
    raf = window.requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!enabled()) return null;
  return <canvas ref={canvasRef} className="footer-ribbons" aria-hidden="true" />;
};

export default FooterRibbons;
