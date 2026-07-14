import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { prefersReducedMotion } from 'lib/env';

/*
 * PageTransition — animates route content in/out as `route` changes, so
 * navigating between pages fades+lifts instead of hard-cutting. Wraps
 * App's pageRenderers[route](...) output; App still fully remounts each
 * page via ErrorBoundary's key={route}, this only covers that swap visually.
 *
 * mode="wait" (rather than the AnimatePresence default) makes the outgoing
 * page finish its exit before the incoming page starts entering, so the two
 * never overlap mid-transition.
 */

const ENTER_S = 0.28; // within the 400ms "complex transition" ceiling
const EXIT_S = ENTER_S * 0.65; // exit ~60-70% of enter, per motion guidelines

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: ENTER_S, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: EXIT_S, ease: 'easeIn' as const } },
};

type PageTransitionProps = {
  route: string;
  children: React.ReactNode;
};

const PageTransition: React.FC<PageTransitionProps> = ({ route, children }) => {
  if (prefersReducedMotion()) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={route} variants={variants} initial="initial" animate="animate" exit="exit">
        {children}
      </m.div>
    </AnimatePresence>
  );
};

export default PageTransition;
