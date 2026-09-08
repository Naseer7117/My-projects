import React from 'react';
import { prefersReducedMotion } from 'lib/env';

/*
 * HelloGreeting — the iPhone-setup "hello" greeting. Each word is DRAWN
 * stroke-by-stroke like a pen writing it: the greeting is an SVG <text> whose
 * glyph OUTLINES are stroked, and stroke-dashoffset animates from the outline's
 * length to 0 so the letters trace themselves on. Because it strokes the real
 * font glyphs, this works for ANY script — Latin, Devanagari (नमस्ते), Telugu
 * (నమస్కారం), CJK, Arabic — each in its NATIVE script, genuinely written on
 * (not slid/wiped in). Then hold + fade, next language writes. Themed to the
 * site accent gradient. Reduced-motion → a single static "hello".
 *
 * Each entry sets its own font-family so complex scripts pick the right glyphs
 * (handwriting Dancing Script for Latin; Noto/system for others).
 */

type Greeting = { word: string; font: string; size: number };

const HANDWRITE = "'Dancing Script', 'Segoe Script', cursive";
// System-first stacks so non-Latin scripts render even before any web font;
// Noto families load if present. Each script gets a legible fallback chain.
// 'Nirmala UI' (bundled on Windows) covers ALL the Indic scripts below.
const DEVANAGARI = "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif";
const TELUGU = "'Noto Sans Telugu', 'Gautami', 'Nirmala UI', sans-serif";
const TAMIL = "'Noto Sans Tamil', 'Latha', 'Nirmala UI', sans-serif";
const KANNADA = "'Noto Sans Kannada', 'Tunga', 'Nirmala UI', sans-serif";
const MALAYALAM = "'Noto Sans Malayalam', 'Kartika', 'Nirmala UI', sans-serif";
const BENGALI = "'Noto Sans Bengali', 'Vrinda', 'Nirmala UI', sans-serif";
const GUJARATI = "'Noto Sans Gujarati', 'Shruti', 'Nirmala UI', sans-serif";
const CJK = "'Noto Sans JP', 'Noto Sans SC', 'Yu Gothic', 'Microsoft YaHei', sans-serif";
const KOREAN = "'Noto Sans KR', 'Malgun Gothic', sans-serif";
const ARABIC = "'Noto Naskh Arabic', 'Segoe UI', 'Tahoma', sans-serif";
const HEBREW = "'Noto Sans Hebrew', 'Segoe UI', 'Arial', sans-serif";
const THAI = "'Noto Sans Thai', 'Leelawadee UI', 'Tahoma', sans-serif";
const CYRILLIC = "'Segoe UI', 'Arial', sans-serif";
const GREEK = "'Segoe UI', 'Arial', sans-serif";

// Curated set: each truly writes-on in its native script. `size` is the SVG
// font-size in the 0..160 viewBox height (scripts with tall marks get a bit
// smaller so nothing clips the box).
const GREETINGS: Greeting[] = [
  // Latin (handwriting script)
  { word: 'hello', font: HANDWRITE, size: 120 }, // English
  { word: 'hola', font: HANDWRITE, size: 120 }, // Spanish
  { word: 'bonjour', font: HANDWRITE, size: 120 }, // French
  { word: 'olá', font: HANDWRITE, size: 120 }, // Portuguese
  { word: 'ciao', font: HANDWRITE, size: 120 }, // Italian
  { word: 'hallo', font: HANDWRITE, size: 120 }, // German / Dutch
  { word: 'merhaba', font: HANDWRITE, size: 100 }, // Turkish
  { word: 'xin chào', font: HANDWRITE, size: 96 }, // Vietnamese
  // Indian languages (Nirmala UI covers all on Windows)
  { word: 'नमस्ते', font: DEVANAGARI, size: 92 }, // Hindi
  { word: 'నమస్కారం', font: TELUGU, size: 88 }, // Telugu
  { word: 'வணக்கம்', font: TAMIL, size: 74 }, // Tamil (wider script → smaller)
  { word: 'ನಮಸ್ಕಾರ', font: KANNADA, size: 78 }, // Kannada (wider script → smaller)
  { word: 'നമസ്കാരം', font: MALAYALAM, size: 72 }, // Malayalam (wider script → smaller)
  { word: 'নমস্কার', font: BENGALI, size: 90 }, // Bengali
  { word: 'નમસ્તે', font: GUJARATI, size: 92 }, // Gujarati
  // Other world scripts
  { word: '你好', font: CJK, size: 104 }, // Chinese
  { word: 'こんにちは', font: CJK, size: 92 }, // Japanese
  { word: '안녕하세요', font: KOREAN, size: 92 }, // Korean
  { word: 'Привет', font: CYRILLIC, size: 104 }, // Russian
  { word: 'Γεια', font: GREEK, size: 108 }, // Greek
  { word: 'สวัสดี', font: THAI, size: 96 }, // Thai
  { word: 'مرحبا', font: ARABIC, size: 100 }, // Arabic
  { word: 'שלום', font: HEBREW, size: 104 }, // Hebrew
];

const WRITE_MS = 1700; // pen traces the word over this
const HOLD_MS = 1000;
const FADE_MS = 550;
const CYCLE = WRITE_MS + HOLD_MS + FADE_MS;

const HelloGreeting: React.FC = () => {
  const reduced = prefersReducedMotion();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reduced) return;
    let alive = true;
    const id = window.setInterval(() => {
      if (alive) setIndex((i) => (i + 1) % GREETINGS.length);
    }, CYCLE);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [reduced]);

  const g = reduced ? GREETINGS[0] : GREETINGS[index];

  return (
    <span className="hello-greeting" aria-label={`${g.word} — hello in many languages`}>
      <svg
        // remount per word so the draw animation restarts
        key={reduced ? 'static' : index}
        className={`hello-greeting__svg${reduced ? ' is-static' : ''}`}
        viewBox="0 0 600 180"
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
        style={
          {
            '--write-ms': `${WRITE_MS}ms`,
            '--hold-ms': `${HOLD_MS}ms`,
            '--fade-ms': `${FADE_MS}ms`,
          } as React.CSSProperties
        }
      >
        <defs>
          <linearGradient id="hello-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="55%" stopColor="var(--accent-2)" />
            <stop offset="100%" stopColor="var(--accent-3)" />
          </linearGradient>
        </defs>
        {/* Stroked glyph outlines trace themselves on (the "writing"); a faint
            fill fades in behind so the finished word reads solid. */}
        <text
          className="hello-greeting__fill"
          x="300"
          y="118"
          textAnchor="middle"
          fontFamily={g.font}
          fontSize={g.size}
          fontWeight={700}
        >
          {g.word}
        </text>
        <text
          className="hello-greeting__stroke"
          x="300"
          y="118"
          textAnchor="middle"
          fontFamily={g.font}
          fontSize={g.size}
          fontWeight={700}
        >
          {g.word}
        </text>
      </svg>
    </span>
  );
};

export default HelloGreeting;
