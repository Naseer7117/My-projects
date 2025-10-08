import React from 'react';
import { ContactContent } from '../types';

type ContactPageProps = {
  data: ContactContent;
};

const ContactPage: React.FC<ContactPageProps> = ({ data }) => (
  <section className="page py-5">
    <div className="container">
      <div className="row g-4 align-items-stretch">
        <div className="col-lg-6">
          <div className="card soft-card h-100">
            <div className="card-body">
              <span className="pill-label">Work with me</span>
              <h2 className="section-title mt-3">Let us craft the next chapter together</h2>
              <p className="text-secondary">{data.availability}</p>
              <div className="mt-4">
                <span className="text-uppercase text-muted small d-block">Email</span>
                <a className="contact-link" href={`mailto:${data.email}`}>
                  {data.email}
                </a>
              </div>
              <div className="mt-3">
                <span className="text-uppercase text-muted small d-block">Location</span>
                <span className="fw-semibold">{data.location}</span>
              </div>
              <div className="d-flex flex-wrap gap-3 mt-4">
                <a className="btn btn-primary" href={`mailto:${data.email}`}>
                  Share a project brief
                </a>
                <button className="btn btn-outline-light" type="button" onClick={() => window.open(`mailto:${data.email}`)}>
                  Request intro deck
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card soft-card h-100">
            <div className="card-body">
              <h3 className="h5">Services</h3>
              <div className="row g-3 mt-2">
                {data.services.map((service) => (
                  <div className="col-sm-12" key={service.title}>
                    <div className="service-item">
                      <h4 className="h6 mb-1">{service.title}</h4>
                      <p className="text-secondary small mb-0">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="section-divider" />

              <h3 className="h5">Availability snapshot</h3>
              <ul className="list-unstyled text-secondary small">
                {data.schedule.map((item) => (
                  <li className="mb-2" key={item.label}>
                    <span className="fw-semibold text-light d-block">{item.label}</span>
                    <span>{item.slots}</span>
                  </li>
                ))}
              </ul>

              <hr className="section-divider" />

              <h3 className="h5">Testimonials</h3>
              {data.testimonials.map((testimonial) => (
                <blockquote className="blockquote small text-secondary" key={testimonial.quote}>
                  "{testimonial.quote}"
                  <footer className="blockquote-footer mt-2 text-light">
                    {testimonial.author} - {testimonial.role}
                  </footer>
                </blockquote>
              ))}

              <div className="mt-4 d-flex flex-wrap gap-3">
                {data.socials.map((social) => (
                  <a className="link-accent" href={social.href} key={social.label}>
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactPage;
