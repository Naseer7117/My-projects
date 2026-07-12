import React from 'react';

/*
 * HeroTicker — the horizontally scrolling strip of tech keywords shown on the
 * home page (once above the content, once below via the `footer` variant). The
 * list is duplicated so the CSS marquee can loop seamlessly.
 */

const WORDS = [
  'Software Engineer',
  'Java 17',
  'Spring Boot',
  'REST APIs',
  'SQL',
  'PostgreSQL',
  'Selenium',
  'CI/CD',
  'AWS',
  'Azure',
  'Git',
  'Python',
  'Data Science',
  'Hibernate',
  'React',
  'TypeScript',
];
const SEQUENCE = [...WORDS, ...WORDS];

type HeroTickerProps = {
  footer?: boolean;
};

const HeroTicker: React.FC<HeroTickerProps> = ({ footer = false }) => (
  <div className={`hero-ticker${footer ? ' hero-ticker--footer' : ''}`} aria-hidden="true">
    <div className={`hero-ticker__inner${footer ? ' hero-ticker__inner--footer' : ''}`}>
      {SEQUENCE.map((word, index) => (
        <span className="hero-ticker__item" key={`${footer ? 'f' : 't'}-${index}-${word}`}>
          {word}
        </span>
      ))}
    </div>
  </div>
);

export default HeroTicker;
