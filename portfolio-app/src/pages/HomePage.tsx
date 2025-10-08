import React from 'react';
import { HeroContent, RouteKey } from '../types';

type HomePageProps = {
  data: HeroContent;
  onNavigate: (route: RouteKey) => void;
};

const HomePage: React.FC<HomePageProps> = ({ data, onNavigate }) => {
  const [showSocials, setShowSocials] = React.useState(false);
  const socialToggleRef = React.useRef<HTMLButtonElement | null>(null);
  const hasSocials = Boolean(data.socials?.length);

  const handleToggleSocials = React.useCallback(() => {
    setShowSocials((prev) => !prev);
    requestAnimationFrame(() => socialToggleRef.current?.blur());
  }, []);

  return (
    <section className="page hero-page py-5">
      <div className="container">
        <div className="row align-items-start g-5">
          <div className="col-lg-7">
            <span className="pill-label">{data.role}</span>
            <h1 className="display-5 fw-bold mt-3">Hi, I am {data.name}.</h1>
            <p className="lead text-accent mt-3">{data.tagline}</p>
            <p className="text-secondary mt-3">{data.summary}</p>
            <p className="text-secondary">{data.introduction}</p>
            <div className="hero-cta-group mt-4">
              <div className="d-flex flex-wrap gap-3">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => onNavigate('projects')}>
                  View projects
                </button>
                <button
                  className="btn btn-outline-light btn-lg hero-social-toggle-btn"
                  type="button"
                  onClick={handleToggleSocials}
                  aria-expanded={showSocials}
                  aria-controls={hasSocials ? 'hero-social-dropdown' : undefined}
                  disabled={!hasSocials}
                  ref={socialToggleRef}
                >
                  {showSocials ? 'Hide social accounts' : 'Explore social accounts'}
                </button>
              </div>
              {hasSocials ? (
                <div
                  className={`hero-social-dropdown${showSocials ? ' show' : ''}`}
                  id="hero-social-dropdown"
                  aria-hidden={!showSocials}
                >
                  <span className="hero-social-label">Connect</span>
                  <div className="hero-social-links">
                    {data.socials?.map((social) => (
                      <a
                        className="hero-social-pill"
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
              ) : null}
            </div>
            <p className="mt-4 text-muted">{data.availabilityNote}</p>
          </div>
          <div className="col-lg-5">
            <div className="hero-portrait-wrapper mb-4">
              <img className="hero-portrait-img" src={data.photo.src} alt={data.photo.alt} />
            </div>
            <div className="card soft-card hero-quick-card">
              <div className="card-body">
                <h2 className="h5 mb-4">Quick paths</h2>
                <div className="list-group list-group-flush">
                  {data.spotlight.map((spot) => (
                    <button
                      key={spot.title}
                      type="button"
                      className="list-group-item list-group-item-action quick-link"
                      onClick={() => onNavigate(spot.route)}
                    >
                      <span className="fw-semibold d-block">{spot.title}</span>
                      <span className="d-block text-muted small">{spot.description}</span>
                    </button>
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

export default HomePage;
