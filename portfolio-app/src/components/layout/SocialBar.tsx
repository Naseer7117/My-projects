import React from 'react';
import { SocialMedia } from 'types';
import { SOCIAL_LABELS, SOCIAL_ICONS } from 'components/layout/socialIcons';

/*
 * SocialBar — the row of social icon buttons (Facebook, Instagram, GitHub,
 * YouTube). Driven by data (portfolioData.socialMedia). A link whose href is
 * '#' or empty renders as a dimmed placeholder — add the real URL in
 * content/portfolio.ts and it becomes a working link. Labels + glyphs come from
 * the shared socialIcons module (also used by SocialOrbit).
 */

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
          {SOCIAL_ICONS[s.platform]}
        </svg>
      );
      return isSet(s.href) ? (
        <a
          key={s.platform}
          className={`social-btn social-btn--${s.platform}`}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={SOCIAL_LABELS[s.platform]}
          title={SOCIAL_LABELS[s.platform]}
        >
          {icon}
        </a>
      ) : (
        <span
          key={s.platform}
          className={`social-btn social-btn--${s.platform} social-btn--empty`}
          aria-label={`${SOCIAL_LABELS[s.platform]} — add your link`}
          title={`${SOCIAL_LABELS[s.platform]} — add your link`}
        >
          {icon}
        </span>
      );
    })}
  </div>
);

export default SocialBar;
