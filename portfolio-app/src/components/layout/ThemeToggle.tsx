import React from 'react';

/*
 * ThemeToggle — a sliding moon↔sun switch. Dark = knob left with a moon; light =
 * knob slides right and morphs to a sun. Both icons live in the track (moon on
 * the left, sun on the right); the knob slides over them and the CSS cross-fades
 * which icon reads as "active". Accessible: a real <button> with aria-pressed +
 * a descriptive label. All motion is CSS (transform slide) — see App.css.
 */

type ThemeToggleProps = {
  theme: 'dark' | 'light';
  onToggle: () => void;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      className={`theme-toggle${isLight ? ' theme-toggle--light' : ''}`}
      onClick={onToggle}
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      {/* moon (left) */}
      <svg className="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {/* sun (right) */}
      <svg className="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" />
          <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" />
          <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" />
          <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" />
        </g>
      </svg>
      {/* the sliding knob */}
      <span className="theme-toggle__knob" aria-hidden="true" />
    </button>
  );
};

export default ThemeToggle;
