import React from 'react';
import { ProjectsContent } from '../types';

type ProjectsPageProps = {
  data: ProjectsContent;
};

const ProjectsPage: React.FC<ProjectsPageProps> = ({ data }) => (
  <section className="page py-5">
    <div className="container">
      <h2 className="section-title text-center mb-5">Selected work</h2>
      <div className="row g-4 projects-featured-grid">
        {data.featured.map((project) => (
          <div className="col-lg-4" key={project.title}>
            <div className="card project-card project-card--featured h-100">
              <div className="card-body d-flex flex-column">
                <span className="badge rounded-pill text-bg-primary align-self-start">Featured</span>
                <h3 className="h5 mt-3">{project.title}</h3>
                <p className="text-accent fw-semibold mb-2">{project.subtitle}</p>
                <p className="text-secondary">{project.description}</p>
                <div className="mt-3">
                  <h4 className="h6 text-uppercase text-muted">Contributions</h4>
                  <ul className="small text-secondary ps-3 mb-2">
                    {project.contributions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <h4 className="h6 text-uppercase text-muted">Outcomes</h4>
                  <ul className="small text-secondary ps-3 mb-0">
                    {project.outcomes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {project.tech.map((tech) => (
                      <span className="badge rounded-pill bg-dark-subtle text-light" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mt-1 projects-labs-grid">
        {data.labs.map((lab) => (
          <div className="col-md-6" key={lab.title}>
            <div className="card soft-card project-card--lab h-100">
              <div className="card-body">
                <h3 className="h5">{lab.title}</h3>
                <p className="text-secondary">{lab.description}</p>
                <a className="link-accent" href={lab.linkHref}>
                  {lab.linkLabel}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mt-1 projects-process-grid">
        {data.process.map((step) => (
          <div className="col-md-4" key={step.title}>
            <div className="card project-card--process h-100">
              <div className="card-body">
                <h3 className="h6 text-uppercase text-accent">{step.title}</h3>
                <p className="text-secondary mb-0">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProjectsPage;
