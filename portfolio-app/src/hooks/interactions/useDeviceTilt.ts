import { useEffect } from 'react';
import { prefersReducedMotion, hasFinePointer } from '../../lib/env';

/*
 * useDeviceTilt — the mobile equivalent of the desktop cursor-parallax. Reads the
 * phone's gyroscope (DeviceOrientationEvent) and writes two CSS custom props on
 * <html>:
 *   --tilt-x : -1..1  (device rolled left/right, from `gamma`)
 *   --tilt-y : -1..1  (device pitched fwd/back, from `beta`)
 * The background layers (aurora, mobile-ambient) read these to drift a few px as
 * you tilt the device, so the page feels three-dimensional in the hand.
 *
 * iOS 13+ gates the sensor behind a permission prompt that MUST be triggered by a
 * user gesture — so we request it on the first touch, once. Android/older iOS
 * expose it without a prompt. Desktop (fine pointer) and reduced-motion skip the
 * whole thing. Values are rAF-throttled and clamped; the listener is passive.
 */

type OrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export function useDeviceTilt(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) return;
    if (hasFinePointer() && window.innerWidth > 900) return; // desktop uses cursor
    if (typeof DeviceOrientationEvent === 'undefined') return;

    const root = document.documentElement;
    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    let started = false;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const onOrient = (e: DeviceOrientationEvent) => {
      // gamma: left-right tilt [-90,90]; beta: front-back [-180,180].
      // Map a comfortable ±30° hand-tilt range to -1..1.
      pendingX = clamp((e.gamma ?? 0) / 30, -1, 1);
      pendingY = clamp(((e.beta ?? 0) - 45) / 30, -1, 1); // ~45° = phone held naturally
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        root.style.setProperty('--tilt-x', pendingX.toFixed(3));
        root.style.setProperty('--tilt-y', pendingY.toFixed(3));
      });
    };

    const attach = () => {
      window.addEventListener('deviceorientation', onOrient, { passive: true });
    };

    // iOS 13+ needs a gesture-triggered permission request; other platforms
    // attach directly.
    const DOE = DeviceOrientationEvent as OrientationWithPermission;
    const needsPermission = typeof DOE.requestPermission === 'function';

    const onFirstTouch = () => {
      if (started) return;
      started = true;
      if (needsPermission) {
        DOE.requestPermission?.()
          .then((res) => {
            if (res === 'granted') attach();
          })
          .catch(() => undefined);
      }
      window.removeEventListener('touchend', onFirstTouch);
    };

    if (needsPermission) {
      // wait for a tap to ask permission (iOS requirement)
      window.addEventListener('touchend', onFirstTouch, { passive: true });
    } else {
      attach();
    }

    return () => {
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('touchend', onFirstTouch);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--tilt-x');
      root.style.removeProperty('--tilt-y');
    };
  }, []);
}
