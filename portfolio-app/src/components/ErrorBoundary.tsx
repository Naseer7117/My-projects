import React from 'react';

/*
 * ErrorBoundary — catches render errors in the page tree so one broken page
 * cannot blank the entire site (React unmounts the whole tree on an uncaught
 * render error). Instead we show a small, on-brand fallback.
 *
 * Error boundaries must be class components — there is no hook equivalent.
 */

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('A page failed to render:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-fallback" role="alert">
            <p>Something went wrong loading this section. Please try another page.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
