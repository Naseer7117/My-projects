import React from 'react';
import MobileAmbient from 'components/effects/MobileAmbient';
import FloatingPaths from 'components/effects/FloatingPaths';
import { prefersReducedMotion, hasFinePointer } from 'lib/env';

/** Mobile = no fine pointer OR a narrow viewport. Desktop already has its own
 *  floating paths inside the cinematic intro, so this only adds them on mobile. */
const isMobileViewport = (): boolean =>
  typeof window !== 'undefined' && !prefersReducedMotion() && (!hasFinePointer() || window.innerWidth <= 900);

/*
 * BackgroundFx — the stack of full-screen decorative layers that sit behind all
 * content. They are inert markup (aria-hidden); the motion is driven by the CSS
 * in App.css and the useInteractions hook, which target these class names. Each
 * layer is independent — removing one simply drops that effect.
 */

const BackgroundFx: React.FC = () => (
  <>
    {/* Mobile-only ambient constellation (self-mounts null on desktop). */}
    <MobileAmbient />
    {/* Mobile-only drifting neon line-work (desktop has its own inside the
        cinematic intro). Pure CSS animation — no cursor needed. */}
    {isMobileViewport() ? (
      <div className="mobile-paths" aria-hidden="true">
        <FloatingPaths />
      </div>
    ) : null}
    <canvas className="particles" aria-hidden="true" />
    <div className="beam" aria-hidden="true" />
    <div className="aurora" aria-hidden="true">
      <span className="aurora__blob aurora__blob--1" />
      <span className="aurora__blob aurora__blob--2" />
      <span className="aurora__blob aurora__blob--3" />
    </div>
    <div className="spotlight" aria-hidden="true" />
    <div className="grain" aria-hidden="true" />
    <div className="scroll-progress" aria-hidden="true" />
    <div className="cursor-ring" aria-hidden="true" />
    <div className="cursor-dot" aria-hidden="true" />
  </>
);

export default BackgroundFx;
