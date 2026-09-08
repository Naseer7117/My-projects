import React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { canRunCinematic } from 'lib/env';
import HelloGreeting from 'components/effects/HelloGreeting';
import ConstellationGrid from 'components/effects/ConstellationGrid';
import FloatingPaths from 'components/effects/FloatingPaths';

/*
 * CinematicIntro — a scroll-pinned "laptop opening" opener for the top of Home
 * (adapted from a shadcn/Tailwind/GSAP sample to THIS stack: plain CSS + site
 * tokens, no Tailwind/cn/Next, no iPhone/app mockup).
 *
 * Sequence (pinned ~2800px of scroll, then RELEASES into the long-scroll):
 *   1. Headline "I am / Naseeruddin Shaik" reveals (blur → sharp).
 *   2. On scroll the headline recedes and a LAPTOP appears CLOSED (lid folded
 *      flat onto the keyboard base).
 *   3. The lid ROTATES UP and open (rotateX -90° → 0°); the screen powers on and
 *      shows the REAL hero — photo, name, tagline, stats, CTAs — as if it's
 *      running on the laptop.
 *   4. The whole laptop lifts/fades away → pin ends → normal landing page below.
 *
 * Desktop-only (a scroll-pin fights touch momentum-scroll): gated on
 * !reduced-motion && fine pointer && width>900; else renders null and the normal
 * HomePage hero is the opener.
 */

gsap.registerPlugin(ScrollTrigger);

export type CinematicIntroProps = {
  name: string;
  role: string;
  tagline: string;
  summary: string;
  photoSrc: string;
  photoAlt: string;
  metrics: { value: number; suffix?: string; label: string }[];
  onViewProjects: () => void;
  onContact: () => void;
};

const CinematicIntro: React.FC<CinematicIntroProps> = ({
  name,
  role,
  tagline,
  summary,
  photoSrc,
  photoAlt,
  metrics,
  onViewProjects,
  onContact,
}) => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const screenRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef(0);
  const heroTriggerRef = React.useRef<ScrollTrigger | null>(null);
  // Whether the intro section is on screen. Everything in here (72 drifting
  // path lines, 60 hue-cycling keys, the constellation rAF) is expensive and
  // POINTLESS once you scroll past the top — this gate freezes all of it.
  const [inView, setInView] = React.useState(true);

  // Motion-only (now runs on MOBILE too — owner wants the same landing on phones).
  // One-shot at mount — a mid-scroll flip would leave a half-torn-down pin. The
  // mouse-sheen effect below simply no-ops on touch; GSAP ScrollTrigger scrubs on
  // touch scroll. Heavy sub-parts self-tune via isLowPowerDevice().
  const enabled = canRunCinematic();

  // Pause the whole intro's animation load when it scrolls out of view. A
  // 200px rootMargin resumes it just before it re-enters. The CSS animations
  // freeze via `.is-offscreen` (animation-play-state:paused) and the
  // constellation's rAF halts via the `active` prop — near-zero idle cost once
  // the visitor is past the hero.
  React.useEffect(() => {
    if (!enabled) return;
    // Scroll-position based, NOT IntersectionObserver: during the GSAP pin the
    // .cinematic-intro is wrapped in a pin-spacer and its geometry is distorted,
    // so an IO on it mis-reported "off-screen" AT THE TOP on mobile — which froze
    // the whole intro (greeting stroke-draw, keys, paths) via `.is-offscreen`.
    // The intro owns the first ~1.6 screens of scroll; treat it as in-view while
    // the visitor is anywhere in that band (+1 screen margin), which the pin can't
    // fool. rAF-throttled.
    let raf = 0;
    const check = () => {
      raf = 0;
      const past = window.scrollY < window.innerHeight * 2.4; // in the intro band
      setInView(past);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  // Mouse-follow sheen on the screen glass.
  React.useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const s = screenRef.current;
        if (!s) return;
        const r = s.getBoundingClientRect();
        s.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
        s.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // Pinned "laptop opening" timeline.
  React.useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Initial states.
      gsap.set('.cine-line', { autoAlpha: 0, y: 60, scale: 0.9, filter: 'blur(18px)' });
      gsap.set('.cine-laptop', { autoAlpha: 0, y: 120, scale: 0.86 });
      gsap.set('.cine-laptop__screen', { rotationX: -92 }); // lid lying flat on the deck (closed)
      gsap.set('.cine-screen-content', { autoAlpha: 0 });
      gsap.set('.cine-screen-glow', { autoAlpha: 0 });
      gsap.set(['.cine-scr__body', '.cine-stat', '.cine-scr__cta'], { autoAlpha: 0, y: 30 });

      // Intro (on load): headline reveals.
      gsap.timeline({ delay: 0.25 }).to('.cine-line', {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.4,
        stagger: 0.16,
        ease: 'expo.out',
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'cine-pin',
          trigger: root,
          start: 'top top',
          // Shorter pin so you scroll THROUGH the laptop faster (was 2800, then
          // 1650 — still left a ~680px dead band where the laptop was already
          // gone but the pin held). Trimmed to 1200 to cut that empty gap below
          // the laptop before the hero arrives. scrub 0.5 (was 1) cuts the
          // smoothing lag so it feels responsive, not heavy.
          end: '+=1200',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });

      tl
        // 1) the NAME "jumps out of the screen" at you — a quick anticipation dip
        //    (shrink back a touch) then a big lunge toward the camera: scales up
        //    hard, lifts slightly, blurs and fades as it flies past the viewer.
        //    Reads as the text launching off the screen before the laptop takes
        //    over. Driven off .cine-headline so only the name lunges.
        .to('.cine-headline', { scale: 0.9, ease: 'power1.in', duration: 0.28 }, 0)
        .to(
          '.cine-headline',
          { scale: 2.4, y: -70, autoAlpha: 0, filter: 'blur(10px)', ease: 'power3.in', duration: 0.85 },
          0.28
        )
        // the rest of the intro text (greeting/kicker/scroll cue) just fades back
        .to(
          ['.hello-greeting-line', '.cine-kicker', '.cine-scrollcue'],
          { scale: 1.06, autoAlpha: 0, filter: 'blur(12px)', ease: 'power2.in', duration: 0.9 },
          0
        )
        .to('.cine-laptop', { autoAlpha: 1, y: 0, scale: 1, ease: 'power3.out', duration: 1.2 }, 0.55)
        // 2) the LID OPENS — slow, deliberate hinge from lying-flat-on-the-deck
        //    (closed, rotationX -92) up to upright (0). Long duration so it reads
        //    as an actual lid lifting, not a snap.
        .to('.cine-laptop__screen', { rotationX: 0, ease: 'power2.inOut', duration: 4 }, 1.1)
        // 3) as the lid passes ~60% open, the screen powers on and the site pops
        //    up on it (tied into the tail of the open so it reveals WITH the lid).
        .to('.cine-screen-glow', { autoAlpha: 1, ease: 'power2.out', duration: 1 }, 3.6)
        .to('.cine-screen-content', { autoAlpha: 1, ease: 'power2.out', duration: 1 }, 3.8)
        .to('.cine-scr__body', { autoAlpha: 1, y: 0, ease: 'expo.out', duration: 1.1 }, 4.0)
        .to('.cine-stat', { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'back.out(1.3)', duration: 0.9 }, 4.2)
        .to('.cine-scr__cta', { autoAlpha: 1, y: 0, ease: 'power3.out', duration: 0.9 }, 4.5)
        // 4) very brief hold on the fully open laptop (trimmed — a longer hold
        //    is just scroll spent doing nothing)
        .to({}, { duration: 0.4 })
        // 5) lift the whole laptop away → page continues below. Single quicker
        //    exit (was a 1.1 + 1.2 two-stage lift out to -135vh, which ate ~2s of
        //    the timeline = lots of dead scroll after the laptop was already
        //    off-screen). It fades as it goes, so it needn't travel a full
        //    screen-and-a-third to disappear.
        .to('.cine-laptop', { y: '-70vh', scale: 0.94, autoAlpha: 0, ease: 'power2.in', duration: 1.2 });
      // (Hero entrance is fired by the hero IntersectionObserver above — plays
      // once when the hero first scrolls into view, right as the laptop clears.)

      ScrollTrigger.refresh();
    }, root);

    // HERO ENTRANCE — SCROLL-DRIVEN (scrubbed), not a fixed timer, so the info
    // appears ACCORDING TO SCROLL SPEED: scroll fast → it snaps in fast; scroll
    // slow → it eases in. Kept OUTSIDE gsap.context() because .hero-page is a
    // SIBLING of the cinematic root (context scopes selectors to root, so it'd
    // find nothing). A scrubbed timeline tied to the hero's own entry range
    // reveals it as you scroll over it.
    const heroPage = document.querySelector<HTMLElement>('.hero-page');
    const heroEls = heroPage
      ? Array.from(
          heroPage.querySelectorAll<HTMLElement>(
            '.hero-title, .lead, .text-secondary, .hero-cta-group, .pill-label, .hero-portrait-wrapper'
          )
        )
      : [];
    if (heroPage && heroEls.length) {
      gsap.set(heroEls, { autoAlpha: 0, y: 60, filter: 'blur(10px)' });
      const heroTl = gsap.timeline({
        scrollTrigger: {
          // Anchor to the hero's OWN viewport entry. The laptop is fully faded
          // (opacity 0) and scrolled far off-screen well before the hero enters,
          // so it can no longer distort the hero's position — a normal
          // element-based trigger works and is far more robust than magic pixel
          // offsets around the pin end. Reveal as the hero rises from just below
          // the fold up to roughly centred, so the blur→rise plays out IN VIEW,
          // paced to scroll speed (fast scroll → fills fast; slow → eases in).
          trigger: heroPage,
          start: 'top 92%',
          end: 'top 42%',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      heroTl.to(heroEls, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.15,
        ease: 'none',
      });
      heroTriggerRef.current = heroTl.scrollTrigger ?? null;
    }

    return () => {
      heroTriggerRef.current?.kill();
      heroTriggerRef.current = null;
      // restore the hero in case its reveal never ran (unmount before scroll)
      if (heroEls.length) gsap.set(heroEls, { clearProps: 'opacity,visibility,transform,filter' });
      ctx.revert();
    };
  }, [enabled]);

  if (!enabled) return null;

  const firstName = name.split(' ')[0];
  const lastName = name.split(' ').slice(1).join(' ');

  return (
    <div
      ref={rootRef}
      className={`cinematic-intro${inView ? '' : ' is-offscreen'}`}
      aria-hidden="true"
    >
      {/* Slow-drifting curved line-work, the deepest background layer. */}
      <FloatingPaths />
      {/* Interactive constellation mesh over it — reacts to cursor velocity
          (shockwaves) across the laptop/scroll area. rAF halts when off-screen. */}
      <ConstellationGrid active={inView} />

      {/* Headline: "I am / Naseeruddin Shaik" */}
      <div className="cine-hero-text">
        {/* iPhone-setup style greeting, cycling languages in a handwriting
            script, above the role kicker. */}
        <span className="cine-line hello-greeting-line">
          <HelloGreeting />
        </span>
        <span className="cine-line cine-kicker">{role}</span>
        <h1 className="cine-line cine-headline">
          <span className="cine-headline__lead">I am</span>
          <span className="cine-headline__name">{name}</span>
        </h1>
        <span className="cine-line cine-scrollcue">Scroll to open ↓</span>
      </div>

      {/* The laptop */}
      <div className="cinematic-intro__stage">
        <div className="cine-laptop">
          {/* Lid / screen (rotates open) */}
          <div ref={screenRef} className="cine-laptop__screen">
            <div className="cine-screen-glow" aria-hidden="true" />
            <span className="cine-screen__sheen" aria-hidden="true" />
            <div className="cine-screen-content">
              <div className="cine-scr">
                <div className="cine-scr__media">
                  <img src={photoSrc} alt={photoAlt} className="cine-scr__photo" />
                </div>
                <div className="cine-scr__body">
                  <span className="cine-scr__name">
                    {firstName} <span className="cine-scr__name-accent">{lastName}</span>
                  </span>
                  <p className="cine-scr__tagline">{tagline}</p>
                  <p className="cine-scr__summary">{summary}</p>
                  <div className="cine-scr__stats">
                    {metrics.map((m) => (
                      <div className="cine-stat" key={m.label}>
                        <span className="cine-stat__value">
                          {m.value}
                          {m.suffix ?? ''}
                        </span>
                        <span className="cine-stat__label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cine-scr__cta">
                    <button type="button" className="cine-btn cine-btn--primary" onClick={onViewProjects}>
                      View projects
                    </button>
                    <button type="button" className="cine-btn cine-btn--ghost" onClick={onContact}>
                      Get in touch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard base */}
          <div className="cine-laptop__base" aria-hidden="true">
            <div className="cine-laptop__hinge" />
            <div className="cine-laptop__keyboard">
              {Array.from({ length: 60 }).map((_, i) => {
                // row + col drives a diagonal neon wave across the RGB keyboard.
                const col = i % 15;
                const row = Math.floor(i / 15);
                return (
                  <span
                    className="cine-key"
                    key={i}
                    style={{ '--k': col + row } as React.CSSProperties}
                  />
                );
              })}
            </div>
            <div className="cine-laptop__trackpad" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicIntro;
