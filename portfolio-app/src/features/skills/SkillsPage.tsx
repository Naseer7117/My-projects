/*
 * SkillsPage.tsx — the SKILLS page.
 *
 * Content comes from portfolioData.skills. It renders:
 *   - three "capability" cards (each numbered 01/02/03),
 *   - a "Preferred toolchain" card listing tools by category,
 *   - a row of "how I work" workflow cards.
 * Pure display: it loops over the data and shows it.
 */
import React from 'react';
import { SkillsContent } from 'types';

type SkillsPageProps = {
  data: SkillsContent;
};

const SkillsPage: React.FC<SkillsPageProps> = ({ data }) => (
  <section className="page py-5">
    <div className="container">
      <h2 className="section-title text-center mb-5" data-reveal>Capabilities</h2>
      <div className="row g-4 skills-cluster-grid">
        {data.clusters.map((cluster, idx) => (
          <div className="col-md-4" key={cluster.title} data-reveal>
            <div className="card soft-card skills-cluster-card h-100" data-tilt="6">
              <div className="card-body">
                <span className={`skills-cluster-badge-wrapper mb-3 cluster-${(idx % 3) + 1}`}>
                  <span className={`skills-cluster-badge cluster-${(idx % 3) + 1}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </span>
                <h3 className="h5">{cluster.title}</h3>
                <p className="text-secondary">{cluster.summary}</p>
                <ul className="small text-muted ps-3 mb-0">
                  {cluster.focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card soft-card skills-toolchain-card mt-5" data-reveal>
        <div className="card-body">
          <h3 className="h5 mb-4">Preferred toolchain</h3>
          <div className="row g-4">
            {data.toolchain.map((item) => (
              <div className="col-md-3 col-sm-6" key={item.label}>
                <h4 className="h6 text-uppercase text-muted">{item.label}</h4>
                <ul className="list-unstyled small text-secondary mb-0">
                  {item.items.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1 skills-workflow-grid">
        {data.workflows.map((workflow) => (
          <div className="col-md-4" key={workflow.title} data-reveal>
            <div className="card skills-workflow-card h-100">
              <div className="card-body">
                <h3 className="h6 text-accent text-uppercase">{workflow.title}</h3>
                <p className="text-secondary mb-0">{workflow.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-title text-center mt-5 mb-4" data-reveal>
        Certifications &amp; internships
      </h3>
      <div className="row g-4 skills-cert-grid">
        {data.certifications.map((cert) => (
          <div className="col-md-4 col-sm-6" key={`${cert.issuer}-${cert.title}`} data-reveal>
            <div className="card cert-card h-100" data-tilt="4">
              <div className="card-body">
                <span className="cert-kind">{cert.kind}</span>
                <h4 className="h6 cert-title">{cert.title}</h4>
                <span className="cert-issuer">{cert.issuer}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card soft-card skills-strengths-card mt-5" data-reveal>
        <div className="card-body">
          <h3 className="h5 mb-4">Professional strengths</h3>
          <div className="strength-tags">
            {data.strengths.map((strength) => (
              <span className="strength-tag" key={strength}>
                {strength}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SkillsPage;
