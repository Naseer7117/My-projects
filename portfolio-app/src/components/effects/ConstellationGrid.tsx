import React from 'react';
import { prefersReducedMotion, isLowPowerDevice } from 'lib/env';

/*
 * ConstellationGrid — an interactive node-mesh that reacts to cursor velocity:
 * a spring-mass grid of points that connect to their neighbours; sweeping the
 * cursor fast fires a shockwave that shoves nodes aside, and they spring back.
 * Near the cursor, nodes light up in the site accent, draw radar rings, and
 * print a hex coordinate readout.
 *
 * Adapted from a shadcn/Tailwind/Next sample to THIS stack (CRA + plain CSS):
 * dropped 'use client', the Tailwind wrapper, the title overlay and the
 * dark-mode media query (the site is always dark). This renders ONLY a
 * transparent-backed <canvas> so it layers as the cinematic intro's background
 * (over its existing bg/aurora), replacing the old static CSS grid. Sized to its
 * PARENT (the 100vh .cinematic-intro), not the window. Decorative + reduced-
 * motion aware — renders nothing when motion is minimised.
 *
 * The physics engine (Hooke's-law spring + damping, cursor-speed shockwave,
 * distance-culled connections) is the sample's; colours use the site tokens.
 */

type ConstellationGridProps = {
  /** When false the rAF loop is stopped (section scrolled off-screen). */
  active?: boolean;
};

const ConstellationGrid: React.FC<ConstellationGridProps> = ({ active = true }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!active) return; // section off-screen — don't run the physics loop at all
    // (No extra low-power gate needed: the whole cinematic is gated off low-power
    // devices via canRunCinematic(), so this only ever runs on capable hardware.)
    const canvas = canvasRef.current;
    if (!canvas) return;
    // alpha:true so we layer OVER the cinematic bg instead of painting it black.
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    // the canvas fills its parent (.cinematic-intro), not the whole window.
    const host = canvas.parentElement;
    if (!host) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    // On weak/no-GPU hardware, dial the mesh DOWN: a sparser grid = fewer nodes,
    // lines and radar draws per frame, and DPR 1 halves the pixels pushed.
    const lowPower = isLowPowerDevice();
    const spacing = lowPower ? 90 : 55;
    const maxDpr = lowPower ? 1 : 2;

    type Node = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      radius: number;
      label: string;
      pulse: number;
    };

    // Cursor is tracked in the canvas's LOCAL coordinate space (offset from the
    // host rect), so it only reacts where the cursor is over the intro area.
    const mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, vx: 0, vy: 0, radius: 220 };
    let nodes: Node[] = [];

    // Accent trio pulled once from the CSS tokens (as "r, g, b" strings).
    const rootStyle = getComputedStyle(document.documentElement);
    const toRgbTriplet = (val: string, fallback: string): string => {
      const v = val.trim();
      if (!v) return fallback;
      // #rrggbb → "r, g, b"
      const hex = v.match(/^#([0-9a-f]{6})$/i);
      if (hex) {
        const n = parseInt(hex[1], 16);
        return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      }
      // rgb(...)/rgba(...) → strip to the three channels
      const rgb = v.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (rgb) return `${rgb[1]}, ${rgb[2]}, ${rgb[3]}`;
      return fallback;
    };
    const nodeColor = toRgbTriplet(rootStyle.getPropertyValue('--text'), '234, 240, 251');
    const accentColor = toRgbTriplet(rootStyle.getPropertyValue('--accent'), '56, 189, 248');

    // Grid dims kept so the connection pass can scan only GRID NEIGHBOURS
    // instead of every pair (see render()). Node index = col * rows + row.
    let cols = 0;
    let rows = 0;
    const initNodes = () => {
      nodes = [];
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          nodes.push({
            x,
            y,
            vx: 0,
            vy: 0,
            baseX: x,
            baseY: y,
            radius: Math.random() * 1.2 + 1.2,
            label: `${(i * 7).toString(16).toUpperCase()}:${(j * 11).toString(16).toUpperCase()}`,
            pulse: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const r = host.getBoundingClientRect();
      width = r.width;
      height = r.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset+scale (was ctx.scale, which compounds on every resize)
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      // ignore when the pointer is outside the intro area (below the fold etc.)
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        mouse.x = -1000;
        mouse.y = -1000;
        return;
      }
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      mouse.vx = (mouse.x - mouse.prevX) / (dt * 1000 || 1);
      mouse.vy = (mouse.y - mouse.prevY) / (dt * 1000 || 1);
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

      // Transparent clear so the cinematic's own background shows through.
      ctx.clearRect(0, 0, width, height);

      const SPRING_K = 18;
      const DAMPING = 0.82;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += dt * 3;
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius && dist > 0) {
          const power = 1 - dist / mouse.radius;
          const force = power * (1500 + speed * 150);
          const angle = Math.atan2(dy, dx);
          n.vx -= Math.cos(angle) * force * dt;
          n.vy -= Math.sin(angle) * force * dt;
        }
        n.vx += (n.baseX - n.x) * SPRING_K * dt;
        n.vy += (n.baseY - n.y) * SPRING_K * dt;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx * dt * 60;
        n.y += n.vy * dt * 60;
      }

      // Connections — PERF: only compare each node to its nearby GRID
      // neighbours, not every other node. MAX_CONN_DIST (75) < ~1.4 grid cells,
      // so with a ±2-cell window we still catch every real connection even when
      // nodes wobble, but the pass is O(n) instead of O(n²) (~118k pair checks →
      // a few thousand). Output is pixel-identical. Node index = col*rows+row;
      // scanning only FORWARD windows draws each edge exactly once.
      const MAX_CONN_DIST = 75;
      const MAX_CONN_DIST_SQ = MAX_CONN_DIST * MAX_CONN_DIST;
      const REACH = 2; // cells to look ahead in each direction
      ctx.lineWidth = 0.7;
      // Set the edge colour ONCE and vary per-edge opacity via globalAlpha —
      // avoids building an `rgba(...)` string for every drawn edge each frame
      // (GC pressure in the hot O(n) pass). Output is pixel-identical: the alpha
      // formula is unchanged, just applied through globalAlpha instead of baked
      // into the string. globalAlpha is reset to 1 before the node/ring passes.
      ctx.strokeStyle = `rgb(${nodeColor})`;
      for (let ci = 0; ci < cols; ci++) {
        for (let rj = 0; rj < rows; rj++) {
          const n = nodes[ci * rows + rj];
          // neighbours: rest of this column below, then the next REACH columns
          for (let cc = ci; cc <= ci + REACH && cc < cols; cc++) {
            const rStart = cc === ci ? rj + 1 : Math.max(0, rj - REACH);
            const rEnd = Math.min(rows - 1, rj + REACH);
            for (let rr = rStart; rr <= rEnd; rr++) {
              const n2 = nodes[cc * rows + rr];
              const ndx = n.x - n2.x;
              const ndy = n.y - n2.y;
              const distSq = ndx * ndx + ndy * ndy;
              if (distSq < MAX_CONN_DIST_SQ) {
                const nDist = Math.sqrt(distSq);
                ctx.globalAlpha = (1 - nDist / MAX_CONN_DIST) * 0.18;
                ctx.beginPath();
                ctx.moveTo(n.x, n.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
              }
            }
          }
        }
      }
      ctx.globalAlpha = 1; // restore before the node fills / rings (they bake alpha into rgba)

      // Label font is a constant — set once per frame, not per near-node.
      ctx.font = '8px ui-monospace, SFMono-Regular, Consolas, monospace';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isNear = dist < mouse.radius;
        const baseAlpha = isNear ? 0.95 : 0.25 + Math.sin(n.pulse) * 0.1;
        ctx.fillStyle = isNear ? `rgba(${accentColor}, ${baseAlpha})` : `rgba(${nodeColor}, ${baseAlpha})`;
        const currentRadius = isNear ? n.radius * 2.2 : n.radius + Math.sin(n.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fill();

        if (dist < 90) {
          const pulseRing = ((n.pulse * 20) % 30) + 4;
          const ringAlpha = (1 - pulseRing / 34) * 0.4;
          ctx.strokeStyle = `rgba(${accentColor}, ${ringAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseRing, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(${accentColor}, 0.85)`;
          ctx.fillText(n.label, n.x + 10, n.y - 10);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="cinematic-intro__constellation" aria-hidden="true" />;
};

export default ConstellationGrid;
