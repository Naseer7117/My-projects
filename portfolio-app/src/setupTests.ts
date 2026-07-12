// jest-dom adds custom matchers like expect(el).toBeInTheDocument().
import '@testing-library/jest-dom';

/*
 * jsdom (the test DOM) does not implement the browser APIs our animation code
 * relies on. Without these stubs, rendering <App /> in a test throws. The
 * production code degrades gracefully when these are absent, so mocking them to
 * no-ops lets the components render and be asserted against.
 *
 * We assign through a loosely-typed alias because TypeScript otherwise assumes
 * these globals always exist and narrows the guards to `never`.
 */
const g = window as unknown as Record<string, unknown>;

// matchMedia — used by prefersReducedMotion() / hasFinePointer().
if (typeof g.matchMedia !== 'function') {
  g.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// IntersectionObserver — used by the scroll-reveal system.
if (typeof g.IntersectionObserver !== 'function') {
  class MockIntersectionObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return [];
    }
  }
  g.IntersectionObserver = MockIntersectionObserver;
}

// Canvas 2D context — used by the particle background (a null context is fine).
if (typeof HTMLCanvasElement.prototype.getContext !== 'function') {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}

// scrollTo — jsdom doesn't implement it; App calls it on route change.
g.scrollTo = () => {};
