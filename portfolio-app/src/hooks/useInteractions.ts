import { useScrollProgress } from './interactions/useScrollProgress';
import { useCursorFx } from './interactions/useCursorFx';
import { useScrollReveal } from './interactions/useScrollReveal';
import { useTilt } from './interactions/useTilt';
import { useMagnetic } from './interactions/useMagnetic';
import { useDeviceTilt } from './interactions/useDeviceTilt';

/*
 * useInteractions — the single entry point App calls to wire up all the motion.
 *
 * It just composes the focused hooks below; each one owns one concern and its
 * own setup/cleanup. See ./interactions/* for the implementations.
 *
 *   Global (set up once):
 *     useScrollProgress — progress bar + navbar scrolled state
 *     useCursorFx       — spotlight, custom cursor, particle constellation
 *     useDeviceTilt     — mobile gyroscope parallax (writes --tilt-x/--tilt-y)
 *   Per route (re-scanned when `route` changes, i.e. a new page mounts):
 *     useScrollReveal   — scroll-in reveals + animated count-ups
 *     useTilt           — 3D pointer tilt on cards
 *     useMagnetic       — magnetic buttons
 */
export function useInteractions(route: string): void {
  useScrollProgress();
  useCursorFx();
  useDeviceTilt();
  useScrollReveal(route);
  useTilt(route);
  useMagnetic(route);
}
