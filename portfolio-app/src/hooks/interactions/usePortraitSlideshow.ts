import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * usePortraitSlideshow — the hover-driven crossfade cycle behind the hero
 * portrait. While hovered it advances through `images` on an interval,
 * crossfading the outgoing image out over `fadeMs`; on hover-out it stops and
 * resets to the first image. Extracted out of HomePage, which only renders
 * what this hook reports.
 */

// Kept as a list (rather than a single value) so a future second animation
// variant is a one-line addition — the cycling logic below doesn't change.
const PORTRAIT_ANIMATIONS = ['blur'] as const;
type PortraitAnimationKey = (typeof PORTRAIT_ANIMATIONS)[number];

type PortraitSlideshow = {
  activeImageSrc: string;
  previousImageSrc: string | null;
  isCrossfading: boolean;
  activeAnimation: PortraitAnimationKey;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function usePortraitSlideshow(
  images: string[],
  intervalMs: number,
  fadeMs: number
): PortraitSlideshow {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousImageSrc, setPreviousImageSrc] = useState<string | null>(null);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState<PortraitAnimationKey>(
    PORTRAIT_ANIMATIONS[0]
  );
  const slideshowTimerRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  const clearFadeTimeout = useCallback(() => {
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (slideshowTimerRef.current !== null) {
      window.clearInterval(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    clearFadeTimeout();
    setIsCrossfading(false);
    setPreviousImageSrc(null);
    setActiveAnimation(PORTRAIT_ANIMATIONS[0]);
  }, [clearFadeTimeout]);

  const advance = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => {
      const nextIndex = (prev + 1) % images.length;
      const priorSrc = images[prev] ?? null;
      if (priorSrc) {
        setPreviousImageSrc(priorSrc);
        setIsCrossfading(true);
        clearFadeTimeout();
        fadeTimeoutRef.current = window.setTimeout(() => {
          setIsCrossfading(false);
          setPreviousImageSrc(null);
          fadeTimeoutRef.current = null;
        }, fadeMs);
      }
      setActiveAnimation(PORTRAIT_ANIMATIONS[nextIndex % PORTRAIT_ANIMATIONS.length]);
      return nextIndex;
    });
  }, [clearFadeTimeout, fadeMs, images]);

  const onMouseEnter = useCallback(() => {
    if (images.length <= 1 || slideshowTimerRef.current !== null) return;
    advance();
    slideshowTimerRef.current = window.setInterval(advance, intervalMs);
  }, [advance, images.length, intervalMs]);

  const onMouseLeave = useCallback(() => {
    stop();
    setActiveIndex(0);
    setActiveAnimation(PORTRAIT_ANIMATIONS[0]);
  }, [stop]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    stop();
    setActiveIndex(0);
    setActiveAnimation(PORTRAIT_ANIMATIONS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, stop]);

  return {
    activeImageSrc: images[activeIndex] ?? images[0],
    previousImageSrc,
    isCrossfading,
    activeAnimation,
    onMouseEnter,
    onMouseLeave,
  };
}
