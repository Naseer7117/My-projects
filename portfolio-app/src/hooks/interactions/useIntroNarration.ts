import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/env';

/*
 * useIntroNarration — speaks a script via the browser's built-in
 * SpeechSynthesis API and reports playback state + per-word timing so a
 * caller can drive a talking-character animation and word-synced captions
 * off real narration progress (not a guessed timer).
 *
 * `words` breaks the script into the same word list speechSynthesis will
 * report boundaries for; `activeWordIndex` advances on each 'boundary' event
 * so captions can highlight/reveal in lockstep with the actual voice.
 *
 * No-ops safely (never throws) when speechSynthesis is unavailable (Safari's
 * support is inconsistent, and it doesn't exist in non-browser/test
 * environments) or when the visitor prefers reduced motion — `supported`
 * tells the caller whether to even show a play button.
 */

export type NarrationState = {
  supported: boolean;
  playing: boolean;
  paused: boolean;
  /** Index into `words` of the word currently being spoken, or -1 before start / after end. */
  activeWordIndex: number;
  words: string[];
  play: () => void;
  pause: () => void;
  stop: () => void;
};

export function useIntroNarration(script: string): NarrationState {
  const words = useRef(script.split(/\s+/).filter(Boolean)).current;
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined' &&
    !prefersReducedMotion();

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setActiveWordIndex(-1);
  }, [supported]);

  const play = useCallback(() => {
    if (!supported) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }
    window.speechSynthesis.cancel(); // clear any stuck queue before starting fresh
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1;
    utterance.pitch = 1;

    // charIndex from the boundary event is a position in `script`; map it to a
    // word index by counting how many word-boundaries have occurred before it.
    let wordCursor = 0;
    utterance.onboundary = (e) => {
      if (e.name !== 'word') return;
      if (wordCursor < words.length) setActiveWordIndex(wordCursor);
      wordCursor += 1;
    };
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
      setActiveWordIndex(-1);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
      setActiveWordIndex(-1);
    };

    utteranceRef.current = utterance;
    setPlaying(true);
    setPaused(false);
    window.speechSynthesis.speak(utterance);
  }, [paused, script, supported, words.length]);

  const pause = useCallback(() => {
    if (!supported || !playing) return;
    window.speechSynthesis.pause();
    setPaused(true);
    setPlaying(false);
  }, [playing, supported]);

  // Stop any in-flight speech on unmount (route change, etc.) so it doesn't
  // keep talking over a page the visitor already navigated away from.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, playing, paused, activeWordIndex, words, play, pause, stop };
}
