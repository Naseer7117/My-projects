import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

/*
 * Smoke tests: prove the app renders and the home page + navigation are present.
 * (The animation APIs these components touch are stubbed in setupTests.ts.)
 */
describe('App', () => {
  it('renders the home hero call-to-action', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /view projects/i })).toBeInTheDocument();
  });

  it('renders the primary navigation tabs', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /^skills$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^contact$/i })).toBeInTheDocument();
  });
});
