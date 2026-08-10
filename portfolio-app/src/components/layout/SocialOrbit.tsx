import React from 'react';
import { SocialMedia } from 'types';

/*
 * SocialOrbit — the footer social buttons arranged as ORBITING RINGS around a
 * glowing centre (adapted from an "orbiting circles" concept to THIS stack:
 * plain CSS keyframes + the site's design tokens, NOT Tailwind/shadcn/Next).
 *
 * Two kinds of orbiting item:
 *   - REAL social links (github/instagram/facebook/youtube) from
 *     portfolioData.socialMedia — clickable, '#' renders a dimmed placeholder.
 *   - DECORATIVE brand badges (slack/gemini/chatgpt/telegram/whatsapp) — not
 *     links, just glowing logos for flavour (like the original sample's tool
 *     logos). They still light up in their brand colour on hover.
 *
 * Each icon rides a ring that rotates; a counter-rotation on the icon keeps it
 * upright while it travels. Rings alternate direction. All icons are inline SVG
 * (no external CDN — CSP-safe). Reduced-motion stops the spin (see App.css).
 */

/** A single thing on the orbit. `href` present → clickable link; absent →
 * decorative badge. `brand` is the `social-btn--*` class carrying its glow
 * colour (defined in App.css). */
type OrbitItem = {
  key: string;
  label: string;
  brand: string; // social-btn--<x> class suffix
  icon: React.ReactNode;
  href?: string;
};

const SOCIAL_LABELS: Record<SocialMedia['platform'], string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  github: 'GitHub',
  youtube: 'YouTube',
};

const SOCIAL_ICONS: Record<SocialMedia['platform'], React.ReactNode> = {
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

// Decorative brand logos (inline SVG). Simplified single-colour glyphs that use
// currentColor so the hover glow tints them — good enough at ~20px, no CDN.
const BADGE_ICONS: Record<string, React.ReactNode> = {
  slack: (
    <path d="M5.04 15.12a2.02 2.02 0 1 1-2.02-2.02h2.02v2.02Zm1.01 0a2.02 2.02 0 0 1 4.04 0v5.05a2.02 2.02 0 0 1-4.04 0v-5.05ZM8.07 5.04a2.02 2.02 0 1 1 2.02-2.02v2.02H8.07Zm0 1.01a2.02 2.02 0 0 1 0 4.04H3.02a2.02 2.02 0 0 1 0-4.04h5.05ZM18.96 8.07a2.02 2.02 0 1 1 2.02 2.02h-2.02V8.07Zm-1.01 0a2.02 2.02 0 0 1-4.04 0V3.02a2.02 2.02 0 0 1 4.04 0v5.05ZM15.93 18.96a2.02 2.02 0 1 1-2.02 2.02v-2.02h2.02Zm0-1.01a2.02 2.02 0 0 1 0-4.04h5.05a2.02 2.02 0 0 1 0 4.04h-5.05Z" />
  ),
  gemini: (
    // 4-point sparkle (Gemini's spark mark)
    <path d="M12 2c.4 4.9 4.1 8.6 9 9-4.9.4-8.6 4.1-9 9-.4-4.9-4.1-8.6-9-9 4.9-.4 8.6-4.1 9-9Z" />
  ),
  chatgpt: (
    <path d="M21.6 9.8a5.4 5.4 0 0 0-.47-4.44 5.47 5.47 0 0 0-5.89-2.62A5.44 5.44 0 0 0 11.1 1a5.47 5.47 0 0 0-5.2 3.78 5.44 5.44 0 0 0-3.63 2.63 5.47 5.47 0 0 0 .67 6.4 5.4 5.4 0 0 0 .47 4.45 5.47 5.47 0 0 0 5.89 2.62A5.43 5.43 0 0 0 12.9 23a5.47 5.47 0 0 0 5.2-3.78 5.44 5.44 0 0 0 3.63-2.63 5.47 5.47 0 0 0-.68-6.4l.53-.4ZM12.9 21.6a4.06 4.06 0 0 1-2.6-.94l3.83-2.2a.62.62 0 0 0 .31-.55v-5.4l1.62.93v4.45a4.07 4.07 0 0 1-3.16 3.71Zm-8.7-3.72a4.05 4.05 0 0 1-.49-2.72l3.83 2.21a.63.63 0 0 0 .63 0l4.68-2.7v1.87l-4.05 2.34a4.07 4.07 0 0 1-4.6-.99v-.01Zm-1-8.29a4.05 4.05 0 0 1 2.12-1.78v4.5a.62.62 0 0 0 .31.54l4.68 2.7-1.62.94-4.06-2.34a4.07 4.07 0 0 1-1.44-4.56Zm13.5 3.14L12 13.03l-1.62-.93 4.68-2.7a.63.63 0 0 0 .31-.55V4.4a4.07 4.07 0 0 1 2.65 5.65l-.02.02Zm1.62-2.44-.01-.02-4.68-2.7a.63.63 0 0 0-.63 0l-4.68 2.7V5.4l4.05-2.34a4.07 4.07 0 0 1 6.05 4.21l-.1.32ZM9.6 12.97 8 12.03V7.6a4.07 4.07 0 0 1 6.67-3.12l-3.83 2.2a.62.62 0 0 0-.31.55l-.93 5.73v.01Zm.87-1.9L12 10.2l1.54.88v1.77L12 13.72l-1.53-.88v-1.77Z" />
  ),
  telegram: (
    <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.26 2.18c-.25.25-.46.46-.94.46l.34-4.77 8.7-7.85c.38-.34-.08-.53-.59-.19L6.7 13.03l-4.63-1.45c-1.01-.31-1.03-1.01.21-1.5L20.63 2.9c.84-.31 1.57.2 1.31 1.4Z" />
  ),
  whatsapp: (
    <path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2Zm5.85 14.13c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.42.27-.29.59-.36.78-.36l.56.01c.18 0 .42-.07.66.5.24.59.82 2.02.9 2.17.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.14.27.09 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.68-.17 1.36Z" />
  ),
};

const isSet = (href?: string) => Boolean(href) && href !== '#';

const DECORATIVE: OrbitItem[] = [
  { key: 'slack', label: 'Slack', brand: 'slack', icon: BADGE_ICONS.slack },
  // Gemini + ChatGPT are LINKS to their official sites (open the tool). The rest
  // stay decorative badges (no href) until real handles are added.
  { key: 'gemini', label: 'Google Gemini', brand: 'gemini', icon: BADGE_ICONS.gemini, href: 'https://gemini.google.com' },
  { key: 'chatgpt', label: 'ChatGPT', brand: 'chatgpt', icon: BADGE_ICONS.chatgpt, href: 'https://chatgpt.com' },
  { key: 'telegram', label: 'Telegram', brand: 'telegram', icon: BADGE_ICONS.telegram },
  { key: 'whatsapp', label: 'WhatsApp', brand: 'whatsapp', icon: BADGE_ICONS.whatsapp },
];

/** One orbiting item: a link (real social) or a decorative badge, pinned to a
 * rotating arm and counter-spun so it reads upright. */
const OrbitIcon: React.FC<{ item: OrbitItem; angle: number; ring: 1 | 2 }> = ({ item, angle, ring }) => {
  const linked = isSet(item.href);
  const icon = (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {item.icon}
    </svg>
  );
  const decorative = item.href === undefined; // slack/telegram/whatsapp badge, not a link
  const btnClass = `social-btn social-btn--${item.brand} social-orbit__btn${linked ? '' : ' social-btn--empty'}`;
  const style = { animationName: ring === 1 ? 'social-orbit-counter-cw' : 'social-orbit-counter-ccw' } as React.CSSProperties;
  const button = linked ? (
    // Real link: labelled for screen readers.
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className={btnClass}
      aria-label={item.label}
      title={item.label}
      style={style}
    >
      {icon}
    </a>
  ) : decorative ? (
    // Decorative badge: keep the hover tooltip (title) but HIDE from a11y —
    // it's not actionable, so it shouldn't announce as a control.
    <span className={btnClass} title={item.label} aria-hidden="true" style={style}>
      {icon}
    </span>
  ) : (
    // Social slot not yet linked (href === '#'): a labelled placeholder.
    <span className={btnClass} aria-label={`${item.label} — add your link`} title={`${item.label} — add your link`} style={style}>
      {icon}
    </span>
  );
  return (
    <span className="social-orbit__arm" style={{ '--angle': `${angle}deg` } as React.CSSProperties}>
      {button}
    </span>
  );
};

const SocialOrbit: React.FC<{ items: SocialMedia[] }> = ({ items }) => {
  // Real social links first, then the decorative brand badges — one combined
  // list distributed across the two rings.
  const socials: OrbitItem[] = items.map((s) => ({
    key: s.platform,
    label: SOCIAL_LABELS[s.platform],
    brand: s.platform,
    icon: SOCIAL_ICONS[s.platform],
    href: s.href,
  }));
  const all = [...socials, ...DECORATIVE];

  // Two counter-rotating rings. The OUTER ring has more circumference, so give
  // it the larger share (odds → outer gets the extra when the count is odd),
  // and interleave so the real socials + decorative badges don't clump.
  const inner = all.filter((_, i) => i % 2 === 1); // 4 of 9
  const outer = all.filter((_, i) => i % 2 === 0); // 5 of 9
  const spread = (list: OrbitItem[]) =>
    list.map((item, i) => ({ item, angle: list.length ? (360 / list.length) * i : 0 }));

  return (
    <div className="social-orbit" role="group" aria-label="Social links">
      <span className="social-orbit__core" aria-hidden="true" />
      <div className="social-orbit__ring social-orbit__ring--1">
        {spread(inner).map(({ item, angle }) => (
          <OrbitIcon key={item.key} item={item} angle={angle} ring={1} />
        ))}
      </div>
      <div className="social-orbit__ring social-orbit__ring--2">
        {spread(outer).map(({ item, angle }) => (
          <OrbitIcon key={item.key} item={item} angle={angle} ring={2} />
        ))}
      </div>
    </div>
  );
};

export default SocialOrbit;
