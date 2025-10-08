import React from 'react';
import { SkillsContent } from '../types';

type SkillsPageProps = {
  data: SkillsContent;
};

const SkillsPage: React.FC<SkillsPageProps> = ({ data }) => (
  <section className="page py-5">
    <div className="container">
      <h2 className="section-title text-center mb-5">Capabilities</h2>
      <div className="row g-4 skills-cluster-grid">
        {data.clusters.map((cluster, idx) => (
          <div className="col-md-4" key={cluster.title}>
            <div className="card soft-card skills-cluster-card h-100">
              <div className="card-body">
                <span className={`skills-cluster-badge-wrapper mb-3 cluster-${(idx % 3) + 1}`}>
                  <span className={`skills-cluster-badge cluster-${(idx % 3) + 1}`}>{cluster.proficiency}%</span>
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

      <div className="card soft-card skills-toolchain-card mt-5">
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
          <div className="col-md-4" key={workflow.title}>
            <div className="card skills-workflow-card h-100">
              <div className="card-body">
                <h3 className="h6 text-accent text-uppercase">{workflow.title}</h3>
                <p className="text-secondary mb-0">{workflow.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SkillsPage;
