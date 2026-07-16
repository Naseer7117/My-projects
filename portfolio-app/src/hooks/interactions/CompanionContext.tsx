import React from 'react';

/*
 * CompanionContext — lets pages tell the globally roaming CompanionCharacter
 * (rendered once in App.tsx) "do something specific right now," via THREE
 * independent handoff channels sharing one provider:
 *
 *   - `talking`: HomePage's Play Intro narration anchors the companion at the
 *     hero photo and stops roaming while narration plays.
 *   - `contextBeatRequest`: a one-shot "walk to this element and do this
 *     behavior" signal for the per-page arrival beats — e.g. About
 *     requesting `sitting` beside its timeline. Fired by each page's
 *     useCompanionContextBeat() call, consumed by useCompanionBehavior,
 *     which routes it through the real Walk FSM (requestWalk).
 *   - `celebrationRequest`: a one-shot "celebrate in place right now" pulse,
 *     fired from REAL outbound-intent clicks only (Projects repo/live links,
 *     Contact's Email-me button). Consumed by useCompanionBehavior, which
 *     plays the short `celebrating` behavior without any walk — the mascot
 *     cheers wherever it currently stands. Deliberately nonce-based like the
 *     context beat so repeat clicks re-fire.
 *
 * Kept as a tiny context rather than lifting page-specific logic up to App:
 * each page owns the lifecycle of ITS trigger (narration playback, a mount-
 * time arrival beat, a link click); only the resulting signal needs to be
 * shared globally with the ONE companion instance App.tsx renders.
 */

export type TalkingHandoff = {
  talking: boolean;
  /** Viewport-relative anchor point to talk from, e.g. the hero photo's center. */
  anchor: { x: number; y: number } | null;
};

/** A page's one-shot arrival beat — behavior/expression are the SAME union
 * types useCompanionBehavior already exports; kept as `string` here (not
 * imported) purely to avoid a circular import between this file and
 * useCompanionBehavior.ts (which itself imports FROM this file for the
 * talking hook) — useCompanionBehavior casts back to its own union when
 * consuming, which is safe since only that file ever calls
 * requestContextBeat's callers (useCompanionContextBeat) with values drawn
 * from its own exported types. */
export type ContextBeatRequest = {
  behavior: string;
  expression?: string;
  target: { x: number; y: number };
  ms: number;
  nonce: number;
};

/** One-shot celebration pulse — only the nonce matters (each increment fires once). */
export type CelebrationRequest = {
  nonce: number;
};

type CompanionContextValue = {
  handoff: TalkingHandoff;
  setHandoff: (next: TalkingHandoff) => void;
  contextBeatRequest: ContextBeatRequest | null;
  requestContextBeat: (beat: Omit<ContextBeatRequest, 'nonce'>) => void;
  celebrationRequest: CelebrationRequest | null;
  requestCelebration: () => void;
};

const DEFAULT_HANDOFF: TalkingHandoff = { talking: false, anchor: null };

const CompanionContext = React.createContext<CompanionContextValue>({
  handoff: DEFAULT_HANDOFF,
  setHandoff: () => undefined,
  contextBeatRequest: null,
  requestContextBeat: () => undefined,
  celebrationRequest: null,
  requestCelebration: () => undefined,
});

export const CompanionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handoff, setHandoff] = React.useState<TalkingHandoff>(DEFAULT_HANDOFF);

  const [contextBeatRequest, setContextBeatRequest] = React.useState<ContextBeatRequest | null>(null);
  const beatNonceRef = React.useRef(0);

  const requestContextBeat = React.useCallback((beat: Omit<ContextBeatRequest, 'nonce'>) => {
    beatNonceRef.current += 1;
    setContextBeatRequest({ ...beat, nonce: beatNonceRef.current });
  }, []);

  const [celebrationRequest, setCelebrationRequest] = React.useState<CelebrationRequest | null>(null);
  const celebrationNonceRef = React.useRef(0);

  const requestCelebration = React.useCallback(() => {
    celebrationNonceRef.current += 1;
    setCelebrationRequest({ nonce: celebrationNonceRef.current });
  }, []);

  const value = React.useMemo(
    () => ({ handoff, setHandoff, contextBeatRequest, requestContextBeat, celebrationRequest, requestCelebration }),
    [handoff, contextBeatRequest, requestContextBeat, celebrationRequest, requestCelebration]
  );
  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
};

/** Read the current talking handoff (consumed by the global CompanionCharacter). */
export function useCompanionHandoff(): TalkingHandoff {
  return React.useContext(CompanionContext).handoff;
}

/** Report talking state + anchor point (called from HomePage during narration). */
export function useSetCompanionHandoff(): (next: TalkingHandoff) => void {
  return React.useContext(CompanionContext).setHandoff;
}

/** Read the latest per-page context-beat request (consumed by useCompanionBehavior). */
export function useCompanionContextBeatRequest(): ContextBeatRequest | null {
  return React.useContext(CompanionContext).contextBeatRequest;
}

/** Fire a one-shot context beat (called from useCompanionContextBeat, one per page). */
export function useRequestCompanionContextBeat(): (beat: Omit<ContextBeatRequest, 'nonce'>) => void {
  return React.useContext(CompanionContext).requestContextBeat;
}

/** Read the latest celebration pulse (consumed by useCompanionBehavior). */
export function useCompanionCelebrationRequest(): CelebrationRequest | null {
  return React.useContext(CompanionContext).celebrationRequest;
}

/** Fire a one-shot celebration (called from real outbound-intent click handlers). */
export function useRequestCompanionCelebration(): () => void {
  return React.useContext(CompanionContext).requestCelebration;
}
