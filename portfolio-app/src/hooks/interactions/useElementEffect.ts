import { useEffect } from 'react';

/*
 * useElementEffect — the shared scaffold behind useTilt and useMagnetic:
 * defer one frame (so the page has painted), run `setup()` to attach
 * listeners to the newly mounted elements, and re-run whenever `routeKey`
 * changes (a new page just mounted). `setup` returns its own cleanup.
 */
export function useElementEffect(routeKey: string, setup: () => () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cleanup: () => void = () => undefined;
    const id = requestAnimationFrame(() => {
      cleanup = setup();
    });
    return () => {
      cancelAnimationFrame(id);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);
}
