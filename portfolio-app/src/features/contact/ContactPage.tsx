/*
 * ContactPage.tsx — the CONTACT page.
 *
 * Content comes from portfolioData.contact. Two cards side by side:
 *   - left: email, location, an "Email me"/"View GitHub" button, and an
 *     availability list,
 *   - right: services offered, testimonials, and social links.
 *
 * It is a pure presentational component: every value comes from the data file.
 */
import React from 'react';
import { ContactContent } from 'types';

type ContactPageProps = {
  data: ContactContent;
};

const ContactPage: React.FC<ContactPageProps> = ({ data }) => {
  return (
    <section className="page contact-page py-5">
      <div className="container">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-6" data-reveal>
          <div className="card soft-card contact-card h-100" data-tilt="3">
            <div className="card-body">
              <span className="pill-label pill-label--sparkle">
                <span className="pill-label__text">Work with me</span>
              </span>
              <h2 className="section-title mt-3">Let&rsquo;s build something together</h2>
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
                  Email me
                </a>
                <a
                  className="btn btn-outline-light"
                  href="https://github.com/Naseer7117"
                  target="_blank"
                  rel="noreferrer"
                >
                  View GitHub
                </a>
              </div>
              {data.schedule?.length ? (
                <div className="contact-schedule mt-5">
                  <h3 className="heading-sparkle mb-3">
                    <span className="heading-sparkle__star" aria-hidden="true" />
                    <span className="heading-sparkle__text">Availability</span>
                  </h3>
                  {data.schedule.map((item) => (
                    <div className="contact-schedule__item" key={item.label}>
                      <span className="contact-schedule__label">{item.label}</span>
                      <span className="contact-schedule__slots">{item.slots}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="col-lg-6" data-reveal>
          <div className="card soft-card contact-card h-100" data-tilt="3">
            <div className="card-body">
              <h3 className="h5 heading-sparkle">
                <span className="heading-sparkle__star" aria-hidden="true" />
                <span className="heading-sparkle__text">Services</span>
                <span className="heading-sparkle__star heading-sparkle__star--mirrored" aria-hidden="true" />
              </h3>
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

              <h3 className="h5 heading-sparkle mt-4">
                <span className="heading-sparkle__star" aria-hidden="true" />
                <span className="heading-sparkle__text">Testimonials</span>
                <span className="heading-sparkle__star heading-sparkle__star--mirrored" aria-hidden="true" />
              </h3>
              {data.testimonials.map((testimonial) => (
                <blockquote className="blockquote small text-secondary" key={testimonial.quote}>
                  "{testimonial.quote}"
                  <footer className="blockquote-footer mt-2 testimonial-footer">
                    {testimonial.author} - {testimonial.role}
                  </footer>
                </blockquote>
              ))}

              <div className="mt-4 d-flex flex-wrap gap-3 contact-socials">
                {data.socials.map((social, index) => (
                  <a
                    className={`btn contact-social-btn contact-social-btn--${index % 3}`}
                    href={social.href}
                    key={social.label}
                    target="_blank"
                    rel="noreferrer"
                  >
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
};

export default ContactPage;
