import React from 'react';

type IntroCaptionsProps = {
  words: string[];
  activeWordIndex: number;
};

/*
 * IntroCaptions — renders the narration script as individual words, dimming
 * unspoken ones and highlighting the current word as useIntroNarration's
 * `activeWordIndex` advances on each real speech 'boundary' event.
 */
const IntroCaptions: React.FC<IntroCaptionsProps> = ({ words, activeWordIndex }) => (
  <p className="hero-intro-captions">
    {words.map((word, i) => {
      const state = i === activeWordIndex ? 'active' : i < activeWordIndex ? 'said' : undefined;
      return (
        <span
          key={`${i}-${word}`}
          className={`hero-intro-captions__word${state ? ` hero-intro-captions__word--${state}` : ''}`}
        >
          {word}{' '}
        </span>
      );
    })}
  </p>
);

export default IntroCaptions;
