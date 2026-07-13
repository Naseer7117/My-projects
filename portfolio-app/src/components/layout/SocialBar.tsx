import React from 'react';
import { SocialMedia } from 'types';

/*
 * SocialBar — the row of social icon buttons (Facebook, Instagram, GitHub,
 * YouTube). Driven by data (portfolioData.socialMedia). A link whose href is
 * '#' or empty renders as a dimmed placeholder — add the real URL in
 * content/portfolio.ts and it becomes a working link.
 */

const LABELS: Record<SocialMedia['platform'], string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  github: 'GitHub',
  youtube: 'YouTube',
};

const ICONS: Record<SocialMedia['platform'], React.ReactNode> = {
  github: (
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.575.106.785-.25.785-.556 0-.274-.01-1-.015-1.963-3.196.695-3.87-1.54-3.87-1.54-.523-1.33-1.277-1.683-1.277-1.683-1.044-.714.08-.7.08-.7 1.154.082 1.76 1.185 1.76 1.185 1.026 1.758 2.693 1.25 3.35.955.104-.743.401-1.25.73-1.538-2.552-.29-5.235-1.276-5.235-5.68 0-1.255.448-2.28 1.183-3.085-.119-.29-.513-1.459.112-3.04 0 0 .965-.309 3.163 1.178a11 11 0 0 1 5.76 0c2.196-1.487 3.16-1.178 3.16-1.178.626 1.581.232 2.75.114 3.04.737.805 1.18 1.83 1.18 3.085 0 4.415-2.687 5.386-5.247 5.67.413.355.78 1.056.78 2.128 0 1.537-.014 2.775-.014 3.153 0 .308.208.667.79.554A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
  ),
  facebook: (
    <path d="M24 12a12 12 0 1 0-13.875 11.855v-8.385H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.47h-2.796v8.385A12 12 0 0 0 24 12Z" />
  ),
  youtube: (
    <path
      fillRule="evenodd"
      d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.77C18.25 5 12 5 12 5s-6.25 0-7.85.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.77C5.75 19 12 19 12 19s6.25 0 7.85-.43A2.5 2.5 0 0 0 21.6 16.8 26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"
    />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.15" />
    </>
  ),
};

type SocialBarProps = {
  items: SocialMedia[];
  className?: string;
};

const isSet = (href: string) => Boolean(href) && href !== '#';

const SocialBar: React.FC<SocialBarProps> = ({ items, className }) => (
  <div className={`social-bar${className ? ` ${className}` : ''}`}>
    {items.map((s) => {
      const icon = (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          {ICONS[s.platform]}
        </svg>
      );
      return isSet(s.href) ? (
        <a
          key={s.platform}
          className={`social-btn social-btn--${s.platform}`}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={LABELS[s.platform]}
          title={LABELS[s.platform]}
        >
          {icon}
        </a>
      ) : (
        <span
          key={s.platform}
          className={`social-btn social-btn--${s.platform} social-btn--empty`}
          aria-label={`${LABELS[s.platform]} — add your link`}
          title={`${LABELS[s.platform]} — add your link`}
        >
          {icon}
        </span>
      );
    })}
  </div>
);

export default SocialBar;
