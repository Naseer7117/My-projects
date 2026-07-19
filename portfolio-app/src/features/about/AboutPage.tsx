/*
 * AboutPage.tsx — the ABOUT page.
 *
 * Content comes from portfolioData.about. It renders three things:
 *   - the biography paragraphs + headline,
 *   - a "Values" card,
 *   - the career TIMELINE (a vertical line with a dot per entry).
 * It's a simple component: it just loops over the data and displays it.
 */
import React from 'react';
import { AboutContent } from 'types';
import { useCompanionContextBeat } from 'hooks/interactions/useCompanionContextBeat';

type AboutPageProps = {
  data: AboutContent;
};

const AboutPage: React.FC<AboutPageProps> = ({ data }) => {
  // Context beat (§5): settle in and "read" beside the first timeline entry —
  // the page's real spine. See useCompanionContextBeat.ts for why this fires
  // once per route-landing and defers to any higher-priority companion state.
  useCompanionContextBeat('about', '.timeline-item', 'sitting', { expression: 'content', ms: 4000 }, true);

  return (
  <section className="page py-5">
    <div className="container">
      <div className="row g-4">
        <div className="col-lg-6" data-reveal>
          <h2 className="section-title">{data.headline}</h2>
          {data.biography.map((paragraph) => (
            <p className="text-secondary" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <div className="col-lg-6" data-reveal>
          <div className="card soft-card h-100" data-tilt="4">
            <div className="card-body">
              <h3 className="h5 mb-4">Values that guide the work</h3>
              <ul className="list-unstyled mb-0">
                {data.values.map((value) => (
                  <li className="mb-3 value-item" key={value.title}>
                    <span className="value-title fw-semibold d-block">{value.title}</span>
                    <span className="value-description small">{value.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <hr className="section-divider" />

      <h3 className="about-subhead" data-reveal>Career &amp; study journey</h3>
      <div className="timeline">
        {data.timeline.map((entry) => (
          <div className="timeline-item" key={entry.period} data-reveal="left">
            <div className="timeline-meta">
              <span className="timeline-period">{entry.period}</span>
            </div>
            <div className="timeline-body">
              <h3 className="h5 mb-1">{entry.title}</h3>
              <span className="text-accent fw-semibold">{entry.organization}</span>
              <ul className="mt-3">
                {entry.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <hr className="section-divider" />

      <div className="row g-4">
        <div className="col-lg-7" data-reveal>
          <h3 className="about-subhead">Education</h3>
          <div className="education-list">
            {data.education.map((ed) => (
              <div className="education-item" key={ed.degree}>
                <span className="education-period">{ed.period}</span>
                <div className="education-body">
                  <h4 className="h6 mb-1">{ed.degree}</h4>
                  <span className="text-accent education-inst">{ed.institution}</span>
                  {ed.detail ? <p className="text-muted small mb-0 mt-1">{ed.detail}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-5" data-reveal>
          <div className="card soft-card h-100" data-tilt="4">
            <div className="card-body">
              <h3 className="h5 mb-4">Languages</h3>
              <ul className="list-unstyled mb-0 language-list">
                {data.languages.map((lang) => (
                  <li className="language-item" key={lang.name}>
                    <span className="language-name fw-semibold">{lang.name}</span>
                    <span className="language-level">{lang.level}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

export default AboutPage;
