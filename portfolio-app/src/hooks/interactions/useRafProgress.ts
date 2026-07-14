import { useEffect, useRef } from 'react';

/*
 * useRafProgress — drives a requestAnimationFrame loop from 0 to 1 over
 * `durationMs` and calls `onStep` each frame with the raw (un-eased) progress.
 * Extracted from the identical timestamp-tracking loops that used to be
 * hand-rolled in Intro (progress bar) and PageScan (sweep beam).
 *
 * `active` gates the loop the same way each caller's own condition used to
 * (`variant` mount for Intro, `running` for PageScan). Toggling it off cancels
 * the frame; toggling it on restarts progress from 0.
 */
export function useRafProgress(
  durationMs: number,
  onStep: (progress: number) => void,
  active: boolean
): void {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    if (!active) return;
    let rafId = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      onStepRef.current(progress);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [durationMs, active]);
}
