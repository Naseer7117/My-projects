import React from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { cinematicMotionAllowed } from 'lib/env';

/*
 * BlockWipeText — an editorial "block-wipe" reveal: a coloured block sweeps
 * left→right across the text, then sweeps out to the right revealing the text
 * behind it. Adapted from a shadcn/Tailwind/Next + @gsap/react sample to THIS
 * stack (CRA + plain CSS, raw gsap): dropped @gsap/react (useGSAP) for a plain
 * useEffect (matching CinematicIntro), dropped Tailwind, and use the SplitText
 * plugin that already ships with gsap 3.13+. Self-contained CSS injected once.
 *
 * Used for "Naseeruddin Shaik" on the loading screen and below the hero greeting.
 * Reduced-motion → the text simply shows, no wipe.
 */

const STYLE_ID = 'block-wipe-text-styles';
// The wiper is a starfield block: an accent-tinted base with layered radial-gradient
// "stars" of varying size/brightness. As it sweeps it also scatters a few small
// star sparkles off its leading edge (the .bwt-spark spans, animated in JS).
// The sparkle layer sits OUTSIDE the line-wrapper's overflow:hidden so the stars
// can fly past the text edge; the wrapper only clips the block itself.
const CSS = `
.bwt-line-outer { position: relative; width: fit-content; max-width: 100%; display: block; box-sizing: border-box; }
.bwt-line-wrapper { position: relative; width: 100%; display: block; overflow: hidden; box-sizing: border-box; }
.bwt-line { position: relative; display: block; width: 100%; box-sizing: border-box; }
.bwt-block {
  position: absolute; top: 0; left: 0; width: 101%; height: 101%;
  pointer-events: none; will-change: transform; z-index: 1;
  border-radius: 6px;
  opacity: 0.68; /* translucent veil — you can partly see through the ribbon */
  background-repeat: repeat;
  /* one position/size per gradient layer in starfieldBackground(), base last */
  background-position:
    0 0, 9px 14px, 24px 6px, 17px 27px, 5px 33px, 31px 19px, 13px 8px, 0 0;
  background-size:
    34px 30px, 30px 34px, 26px 28px, 40px 24px, 22px 36px, 28px 26px, 18px 20px, 100% 100%;
  /* GLOW: a soft luminous bloom (lighter than before, so the ribbon reads as a
     translucent rainbow veil, not a solid glowing slab). currentColor tints it. */
  box-shadow:
    0 0 14px 1px currentColor,
    0 0 30px 4px currentColor,
    inset 0 0 12px rgba(255, 255, 255, 0.22);
}
/* a soft hot edge on the LEADING (right) side — reads as the sweep front. */
.bwt-block::after {
  content: '';
  position: absolute; top: -2px; bottom: -2px; right: -1px; width: 7px;
  border-radius: 6px;
  background: linear-gradient(90deg, transparent, #fff);
  filter: blur(1px) drop-shadow(0 0 8px currentColor);
  opacity: 0.7;
}
.bwt-sparks { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; overflow: visible; }
.bwt-spark {
  position: absolute; top: 0; left: 0; width: 9px; height: 9px; opacity: 0;
  will-change: transform, opacity; pointer-events: none;
  background: radial-gradient(circle, #fff 0%, #fff 30%, currentColor 60%, transparent 74%);
  filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 2px #fff);
  clip-path: polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%);
}
/* fairy dust: a softer, ROUND glowing mote (no hard star points), gentle bloom.
   Slow drift is set on the timeline; the twinkle keyframe adds a subtle shimmer. */
.bwt-dust {
  clip-path: none;
  background: radial-gradient(circle, #fff 0%, currentColor 45%, transparent 70%);
  filter: drop-shadow(0 0 4px currentColor);
  animation: bwt-twinkle 1.2s ease-in-out infinite;
}
@keyframes bwt-twinkle {
  0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
  50% { filter: drop-shadow(0 0 7px currentColor) drop-shadow(0 0 2px #fff); }
}
`;

/**
 * Build the layered starfield fill. Layered white "star" dots over a TRANSLUCENT
 * MULTICOLOUR base — an aurora sweep blending the site's three accents (violet →
 * cyan → pink) so the ribbon reads as a shimmering rainbow veil you can partly
 * see through, not a solid bar. `color` is kept only as the glow/currentColor
 * tint (box-shadow, sparks); the base is a fixed multi-hue aurora.
 */
function starfieldBackground(_color: string): string {
  const star = (r: number, a: number) => `radial-gradient(circle, rgba(255,255,255,${a}) ${r}px, transparent ${r + 0.9}px)`;
  // Lower star alphas too (the base is translucent, so stars needn't fight a
  // bright fill). front-to-back: stars → a translucent multicolour aurora base.
  return [
    star(1.7, 0.95),
    star(1.2, 0.85),
    star(0.9, 0.7),
    star(1.4, 0.8),
    star(0.7, 0.5),
    star(0.8, 0.45),
    star(1.0, 0.65),
    // aurora base: three accents swept diagonally, all at LOW alpha (~0.42) so the
    // ribbon is a see-through rainbow veil; a faint white core keeps it luminous.
    'linear-gradient(115deg,' +
      ' rgba(139,123,255,0.44) 0%,' + // --accent  (violet)
      ' rgba(34,211,238,0.40) 34%,' + // --accent-2 (cyan)
      ' rgba(255,255,255,0.30) 52%,' + // hot core
      ' rgba(244,114,182,0.42) 70%,' + // --accent-3 (pink)
      ' rgba(139,123,255,0.44) 100%)',
  ].join(', ');
}

function injectStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

gsap.registerPlugin(SplitText);

type BlockWipeTextProps = {
  children: React.ReactNode;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Colour of the wiping block. Defaults to the site accent. */
  blockColor?: string;
  /** Duration of each block sweep (in and out) in seconds. */
  duration?: number;
  className?: string;
  /**
   * Hold the wipe until the loading intro has finished. When true, the reveal
   * does not start until <html> loses the `intro-active` class (set/removed by
   * the boot script + App). Without this the wipe would play behind the loading
   * curtain and be over before the visitor ever sees the name.
   */
  waitForIntro?: boolean;
};

const BlockWipeText: React.FC<BlockWipeTextProps> = ({
  children,
  delay = 0,
  blockColor = 'var(--accent)',
  duration = 0.7,
  className,
  waitForIntro = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion (touch only — desktop always animates): show text, no wipe.
    if (!cinematicMotionAllowed()) {
      el.style.opacity = '1';
      return;
    }
    injectStyles();

    let split: SplitText | null = null;
    let cancelled = false;
    const tls: gsap.core.Timeline[] = [];

    // Particle counts scale with the LINE WIDTH so the sparkle DENSITY is the
    // same at every size. They used to be fixed (16 / 44), which made the big
    // cinematic headline (885x98 = 3.6x the area of the 401x60 loading brand)
    // look far sparser than the loading screen for the same counts.
    // Reference density comes from the loading brand, which is the look we want:
    //   16 sparks / 401px  and  44 dust / 401px.
    const REF_W = 401;
    const sparksFor = (w: number) => Math.max(10, Math.min(48, Math.round((16 / REF_W) * w)));
    const dustFor = (w: number) => Math.max(28, Math.min(140, Math.round((44 / REF_W) * w)));

    // Hide the raw text until SplitText runs (so it doesn't flash as plain text
    // during the fonts wait). run() hands opacity control to GSAP immediately
    // after splitting, and forceReveal() is a hard fallback — so this can never
    // leave the name stuck invisible.
    el.style.opacity = '0';

    const run = () => {
      if (cancelled || !ref.current) return;
      // Split into LINES only (keeps each line's text intact — perfect spacing and
      // per-line gradient). The reveal is a left→right CLIP that follows the
      // ribbon edge, so the text is unveiled progressively (as if wiped on) WITHOUT
      // breaking the word/letter spacing that per-char splitting destroys.
      split = new SplitText(el, { type: 'lines', linesClass: 'bwt-line' });
      const lines: HTMLElement[] = [];
      const blocks: HTMLElement[] = [];
      const sparkLayers: HTMLElement[] = [];

      split.lines.forEach((line) => {
        const node = line as HTMLElement;
        const parent = node.parentNode as HTMLElement;
        // outer (sparks can overflow) > wrapper (clips block) > line + block
        const outer = document.createElement('div');
        outer.className = 'bwt-line-outer';
        const wrapper = document.createElement('div');
        wrapper.className = 'bwt-line-wrapper';
        parent.insertBefore(outer, node);
        outer.appendChild(wrapper);
        wrapper.appendChild(node);

        const block = document.createElement('div');
        block.className = 'bwt-block';
        block.style.background = starfieldBackground(blockColor);
        block.style.color = blockColor; // drives the glow (box-shadow / ::after via currentColor)
        wrapper.appendChild(block);

        // spark layer lives on the outer so stars fly past the text edge
        const sparks = document.createElement('div');
        sparks.className = 'bwt-sparks';
        sparks.style.color = blockColor; // stars inherit the accent via currentColor
        outer.appendChild(sparks);

        lines.push(node);
        blocks.push(block);
        sparkLayers.push(sparks);
      });

      // Line stays "on" but clipped away (inset from the right = 100% hidden); the
      // clip opens left→right as the ribbon passes, unveiling the text.
      gsap.set(lines, { opacity: 1, clipPath: 'inset(-20% 100% -20% 0%)' });
      gsap.set(blocks, { scaleX: 0, transformOrigin: 'left center' });
      // hand visibility control to GSAP — un-hide the wrapper
      el.style.opacity = '';

      lines.forEach((line, i) => {
        const block = blocks[i];
        const sparks = sparkLayers[i];
        const w = line.offsetWidth || 1;
        const h = line.offsetHeight || 1;

        // paused: the wait logic plays these once we're ready (see below)
        const tl = gsap.timeline({ delay: delay + i * 0.1, paused: true });
        // sweep IN — the block grows left→right; sparks scatter off its leading edge
        tl.to(block, { scaleX: 1, duration, ease: 'power4.inOut' }, 0);

        // REVEAL the text with a left→right CLIP that tracks the SAME edge as the
        // ribbon (same duration + ease), so the text is unveiled exactly as the
        // ribbon passes over it — a clean "wipe-on" reveal. The text stays one
        // intact element, so spacing and the gradient are preserved. A tiny lag
        // (0.06d) keeps the reveal just BEHIND the leading edge.
        tl.to(
          line,
          { clipPath: 'inset(-20% 0% -20% 0%)', duration, ease: 'power4.inOut' },
          duration * 0.06
        );

        // Counts scale with THIS line's width so the density matches at any size.
        const sparkCount = sparksFor(w);
        const dustCount = dustFor(w);
        // ...and the particle SIZE scales with the line height (reference: the
        // loading brand's ~60px line), so stars don't look tiny on the big
        // cinematic headline. Clamped so it never gets silly at extreme sizes.
        const sizeScale = Math.max(1, Math.min(1.9, h / 60));

        // (a) LEADING-EDGE sparks — quick 4-point stars that jump forward (right)
        //     off the moving edge as it sweeps. The "spark trail" of the wipe.
        for (let s = 0; s < sparkCount; s++) {
          const spark = document.createElement('span');
          spark.className = 'bwt-spark';
          sparks.appendChild(spark);
          // spawn along the sweep: at progress p the edge is at x = p*w
          const p = (s + 0.5) / sparkCount;
          const startX = p * w;
          const startY = (0.15 + 0.7 * ((s * 0.37) % 1)) * h; // spread vertically
          const driftX = (18 + 40 * ((s * 0.53) % 1)) * sizeScale; // fly forward (right) + out
          const driftY = (((s % 2) === 0 ? -1 : 1)) * (14 + 30 * ((s * 0.29) % 1)) * sizeScale;
          const size = (6 + 8 * ((s * 0.61) % 1)) * sizeScale;
          gsap.set(spark, { x: startX, y: startY, width: size, height: size, xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
          tl.to(spark, { opacity: 1, scale: 1, duration: duration * 0.28, ease: 'power2.out' }, duration * p)
            .to(spark, { x: startX + driftX, y: startY + driftY, opacity: 0, scale: 0.3, rotate: 90, duration: duration * 0.55, ease: 'power1.out' }, duration * p + duration * 0.12);
        }

        // (b) FAIRY DUST — a soft cloud shed SIDEWAYS (up & down) from the ribbon's
        //     top/bottom edges all along its length, drifting out SLOWLY with a
        //     long twinkle-fade well after the sweep. This is the "magic" — a
        //     ribbon trailing pixie dust. Slower + smaller + more numerous, and
        //     it lives past the block-out so the sparkle lingers on the revealed name.
        // ~96px = 1cm on a standard display. Motes waft OUT 2–5cm (≈75–190px)
        // above & below the ribbon — a long, dramatic sideways scatter.
        const CM = 96;
        for (let s = 0; s < dustCount; s++) {
          const dust = document.createElement('span');
          dust.className = 'bwt-spark bwt-dust';
          sparks.appendChild(dust);
          const p = (s + 0.5) / dustCount;                 // where along the ribbon
          const up = s % 2 === 0;                           // alternate above/below
          const startX = p * w + (((s * 0.41) % 1) - 0.5) * 24; // near the edge as it passes, slight jitter
          const startY = up ? h * 0.12 : h * 0.88;          // near top / bottom edge
          // travel 2cm..5cm out (up or down) — the long sideways scatter you asked for
          const driftY = (up ? -1 : 1) * (2 * CM + 3 * CM * ((s * 0.31) % 1));
          const driftX = (((s * 0.67) % 1) - 0.5) * 70 * sizeScale; // gentle lateral wander (wider spread)
          const size = (3 + 4 * ((s * 0.53) % 1)) * sizeScale;      // small dust motes
          gsap.set(dust, { x: startX, y: startY, width: size, height: size, xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
          // appear as the edge reaches it, then a LONG slow drift-out. Longer travel
          // wants a longer time so it still reads as slow: 3.2x the sweep.
          const born = duration * p;
          tl.to(dust, { opacity: 0.85, scale: 1, duration: duration * 0.4, ease: 'sine.out' }, born)
            .to(
              dust,
              { x: startX + driftX, y: startY + driftY, opacity: 0, scale: 0.4, rotate: (up ? -1 : 1) * 60, duration: duration * 3.2, ease: 'sine.out' },
              born + duration * 0.18
            );
        }

        // By t=duration the ribbon fully covers the line and the clip has fully
        // opened (text unveiled behind it). Sweep the ribbon OUT to the right for
        // a graceful exit (slower than the sweep-in).
        tl.set(block, { transformOrigin: 'right center' }, duration)
          .to(block, { scaleX: 0, duration: duration * 1.5, ease: 'power3.inOut' }, duration);

        // PERF: once the reveal is done, REMOVE the spark/dust nodes and the
        // ribbon from the DOM. They are one-shot decorations, but each carries
        // will-change + an infinite twinkle animation — leaving ~130 of them
        // behind per page permanently cost compositor work on every scroll
        // frame (measured: they were the single largest will-change owner).
        tl.call(() => {
          sparks.remove();
          block.remove();
        });
        tls.push(tl);
      });
    };

    let introTimer = 0;
    let safetyTimer = 0;
    let played = false;

    // Force the text visible no matter what (hard fallback). GSAP owns the line
    // clip (starts fully clipped away), so if the wipe never plays — an edge case
    // in the intro wait, a killed timeline — the text would otherwise stay hidden.
    // This guarantees the name ALWAYS ends up shown.
    const forceReveal = () => {
      if (cancelled) return;
      el.style.opacity = ''; // un-hide the wrapper if run() never did
      if (split) {
        gsap.set(split.lines, { opacity: 1, clipPath: 'none', clearProps: 'clipPath' });
      } else {
        el.style.opacity = '1'; // no split at all — just show the raw text
      }
    };

    // The reveal is ONLY the clip tracking the ribbon edge — no separate fade,
    // rise or scale on the text. That is what makes every placement look the
    // same: the letters are unveiled purely by the wipe passing over them.
    const playAll = () => {
      if (cancelled || played) return;
      played = true;
      window.clearTimeout(introTimer);
      tls.forEach((t) => t.play(0));
    };

    // "Is the loading intro still up?" — true while EITHER the boot script's
    // `intro-active` class (set pre-paint on <html>, before React mounts) is
    // present, OR the React <Intro> overlay element is still mounted. Using both
    // avoids a race: on a warm load React can mount + the wipe's fonts.ready can
    // resolve so fast that the `.intro` element check alone runs a frame before
    // React commits the overlay — which made the wipe fire behind the loading
    // screen and be over before the visitor saw the name (the reported bug).
    const introUp = () =>
      document.documentElement.classList.contains('intro-active') ||
      !!document.querySelector('.intro');

    // Build the split + (paused) timelines now, so the name is measured and the
    // text is clipped away under GSAP's control. Then decide WHEN to play.
    const begin = () => {
      if (cancelled) return;
      run();

      // Safety net: whatever happens with the intro wait, the text is revealed
      // within 6s of build. (playAll cancels this by revealing via the wipe.)
      safetyTimer = window.setTimeout(forceReveal, 6000);

      // Play immediately only when we are NOT gating on the intro.
      if (!waitForIntro) {
        playAll();
        return;
      }
      // Gate on the intro: if it's already fully gone, play now; otherwise poll
      // until it clears (a MutationObserver misses the `intro-active` class flip
      // on <html>, so poll — cheap, and stops the moment it fires).
      if (!introUp()) {
        playAll();
        return;
      }
      let elapsed = 0;
      const tick = () => {
        if (cancelled || played) return;
        if (!introUp()) {
          // small beat so the name has settled in view before the ribbon sweeps
          introTimer = window.setTimeout(() => playAll(), 120);
          return;
        }
        elapsed += 60;
        if (elapsed > 8000) { playAll(); return; } // never hang
        introTimer = window.setTimeout(tick, 60);
      };
      tick();
    };

    // Wait for fonts so the split measures line widths correctly.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(begin);
    } else {
      begin();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(introTimer);
      window.clearTimeout(safetyTimer);
      tls.forEach((t) => t.kill());
      if (split) split.revert();
    };
  }, [delay, blockColor, duration, waitForIntro]);

  return (
    <div ref={ref} className={className} style={{ opacity: cinematicMotionAllowed() ? undefined : 1 }}>
      {children}
    </div>
  );
};

export default BlockWipeText;
