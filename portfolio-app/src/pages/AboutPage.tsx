import React from 'react';
import { AboutContent } from '../types';

type AboutPageProps = {
  data: AboutContent;
};

const AboutPage: React.FC<AboutPageProps> = ({ data }) => (
  <section className="page py-5">
    <div className="container">
      <div className="row g-4">
        <div className="col-lg-6">
          <h2 className="section-title">{data.headline}</h2>
          {data.biography.map((paragraph) => (
            <p className="text-secondary" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <div className="col-lg-6">
          <div className="card soft-card h-100">
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

      <div className="timeline">
        {data.timeline.map((entry) => (
          <div className="timeline-item" key={entry.period}>
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
    </div>
  </section>
);

export default AboutPage;
