import React from 'react';
import { ContactContent } from '../types';

type ContactPageProps = {
  data: ContactContent;
};

const ContactPage: React.FC<ContactPageProps> = ({ data }) => {
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = document.documentElement;
    const defaultAngle = '32deg';
    const defaultOffset = '0px';

    const updateBackgroundOffset = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight || 1;
      const progress = Math.min(1, Math.max(0, scrollTop / docHeight));
      const offset = progress * 220;
      target.style.setProperty('--contact-background-offset', `${offset}px`);
    };

    if (prefersReducedMotion) {
      target.style.setProperty('--contact-card-angle', defaultAngle);
      target.style.setProperty('--contact-background-offset', defaultOffset);
      return () => {
        target.style.setProperty('--contact-card-angle', defaultAngle);
        target.style.setProperty('--contact-background-offset', defaultOffset);
      };
    }

    target.style.setProperty('--contact-card-angle', defaultAngle);
    updateBackgroundOffset();
    window.addEventListener('scroll', updateBackgroundOffset, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateBackgroundOffset);
      target.style.setProperty('--contact-card-angle', defaultAngle);
      target.style.setProperty('--contact-background-offset', defaultOffset);
    };
  }, []);

  return (
    <section className="page contact-page py-5">
      <div className="container">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-6">
          <div className="card soft-card contact-card h-100">
            <div className="card-body">
              <span className="pill-label pill-label--sparkle">
                <span className="pill-label__sparkle pill-label__sparkle--top-left" aria-hidden="true" />
                <span className="pill-label__sparkle pill-label__sparkle--top-right" aria-hidden="true" />
                <span className="pill-label__sparkle pill-label__sparkle--bottom-left" aria-hidden="true" />
                <span className="pill-label__sparkle pill-label__sparkle--bottom-right" aria-hidden="true" />
                <span className="pill-label__text">Work with me</span>
              </span>
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
          <div className="card soft-card contact-card h-100">
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
