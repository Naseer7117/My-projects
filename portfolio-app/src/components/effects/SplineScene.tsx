import React, { Suspense, lazy } from 'react';
import ErrorBoundary from 'components/ErrorBoundary';

/*
 * SplineScene — lazy wrapper around @splinetool/react-spline (adapted from the
 * shadcn/Next sample to THIS stack: CRA + plain CSS, no Tailwind, no "use
 * client"). The heavy WebGL runtime + the scene file only load when this
 * mounts, behind a Suspense fallback spinner. Imported from the package ROOT
 * (`.` export) — the `/next` subpath is the only Next-specific build.
 *
 * CRASH SAFETY: react-spline@4 has NO onError callback — on a scene-load OR
 * lazy-chunk failure (CDN down / 404 / offline) it THROWS during render, and
 * Suspense does NOT catch throws. Unhandled, that would unmount the whole app
 * (blank page), because this can render OUTSIDE the page ErrorBoundary (e.g.
 * in the footer). So we wrap it in our ErrorBoundary with fallback={null}: any
 * failure just renders nothing — the surrounding UI (e.g. the footer orbit)
 * stays intact and the app never white-screens.
 */

const Spline = lazy(() => import('@splinetool/react-spline'));

type SplineSceneProps = {
  scene: string;
  className?: string;
};

const SplineScene: React.FC<SplineSceneProps> = ({ scene, className }) => (
  <ErrorBoundary fallback={null}>
    <Suspense
      fallback={
        <div className="spline-scene__fallback">
          <span className="spline-scene__loader" aria-hidden="true" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  </ErrorBoundary>
);

export default SplineScene;
