import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hero call to action', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /view projects/i })).toBeInTheDocument();
});
