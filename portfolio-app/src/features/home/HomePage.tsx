/*
 * HomePage.tsx — the HOME page (the "hero" section).
 *
 * It receives its content via the `data` prop (from portfolioData.hero) and
 * renders: the big animated title, the tagline/intro text, the call-to-action
 * buttons, the portrait photo (which cross-fades through a gallery on hover),
 * the "Quick paths" card, the animated number metrics, and the tech stats.
 *
 * Most of the code below is the PORTRAIT SLIDESHOW: when the mouse is over the
 * photo it cycles through the gallery images with a cross-fade. `data-reveal`
 * and `data-tilt` attributes in the JSX are hooks for the scroll/tilt
 * animations (handled in useInteractions.ts).
 */
import React from 'react';
import { HeroContent, RouteKey } from 'types';
import { usePortraitSlideshow } from 'hooks/interactions/usePortraitSlideshow';

type HomePageProps = {
  data: HeroContent;
  onNavigate: (route: RouteKey) => void;
};

const HomePage: React.FC<HomePageProps> = ({ data, onNavigate }) => {
  const [showSocials, setShowSocials] = React.useState(false);
  const socialToggleRef = React.useRef<HTMLButtonElement | null>(null);
  const hasSocials = Boolean(data.socials?.length);
  const heroImages = React.useMemo(() => {
    const gallery = Array.isArray(data.photo.gallery)
      ? data.photo.gallery.filter((url): url is string => Boolean(url))
      : [];
    if (!gallery.length) {
      return [data.photo.src];
    }
    return gallery[0] === data.photo.src ? gallery : [data.photo.src, ...gallery];
  }, [data.photo.gallery, data.photo.src]);
  const fadeDuration = data.photo.slideshowFadeMs ?? 600;
  const {
    activeImageSrc: activeHeroImageSrc,
    previousImageSrc,
    isCrossfading,
    activeAnimation,
    onMouseEnter: handleMouseEnterPortrait,
    onMouseLeave: handleMouseLeavePortrait,
  } = usePortraitSlideshow(heroImages, data.photo.slideshowIntervalMs ?? 1200, fadeDuration);
  const portraitStageStyle = React.useMemo(
    () =>
      ({
        '--hero-portrait-animation-duration': `${fadeDuration}ms`,
        '--hero-portrait-fade-duration': `${fadeDuration}ms`,
      }) as React.CSSProperties,
    [fadeDuration]
  );

  const handleToggleSocials = React.useCallback(() => {
    setShowSocials((prev) => !prev);
    requestAnimationFrame(() => socialToggleRef.current?.blur());
  }, []);

  const heroPortraitStageClassName = [
    'hero-portrait-stage',
    `animation-${activeAnimation}`,
    isCrossfading ? 'is-crossfading' : '',
    previousImageSrc ? 'has-previous' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="page hero-page py-5">
      <div className="container-xxl">
        <div className="row align-items-start gy-5 gx-lg-4 gx-xl-5">
          <div className="col-lg-7 col-xl-8">
            <span className="pill-label" data-reveal>{data.role}</span>
            <h1 className="display-5 fw-bold mt-3 hero-title">
              {['Hi,', 'I', 'am'].map((word, i) => (
                <React.Fragment key={word}>
                  <span className="hero-word" style={{ '--i': i } as React.CSSProperties}>
                    {word}
                  </span>{' '}
                </React.Fragment>
              ))}
              {data.name.split(' ').map((word, i, arr) => (
                <React.Fragment key={word}>
                  <span
                    className="hero-word hero-title__name"
                    style={{ '--i': i + 3 } as React.CSSProperties}
                  >
                    {word}
                    {i === arr.length - 1 ? '.' : ''}
                  </span>{' '}
                </React.Fragment>
              ))}
            </h1>
            <p className="lead text-accent mt-3" data-reveal>{data.tagline}</p>
            <p className="text-secondary mt-3" data-reveal>{data.summary}</p>
            <p className="text-secondary" data-reveal>{data.introduction}</p>
            <div className="hero-cta-group mt-4" data-reveal>
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
            <p className="mt-4 text-muted" data-reveal>{data.availabilityNote}</p>
          </div>
          <div className="col-lg-5 col-xl-4 ms-lg-auto hero-sidebar">
            <div className="hero-portrait-wrapper mb-4" data-reveal>
              <div
                className={heroPortraitStageClassName}
                onMouseEnter={handleMouseEnterPortrait}
                onMouseLeave={handleMouseLeavePortrait}
                style={portraitStageStyle}
                data-tilt="7"
              >
                {previousImageSrc ? (
                  <img
                    className="hero-portrait-img hero-portrait-img--previous"
                    src={previousImageSrc}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                  />
                ) : null}
                <img
                  className="hero-portrait-img hero-portrait-img--current"
                  src={activeHeroImageSrc}
                  alt={data.photo.alt}
                  decoding="async"
                  fetchPriority="high"
                />
                <span className="hero-portrait-shine" aria-hidden="true" />
                <span className="hero-portrait-scan" aria-hidden="true" />
              </div>
            </div>
            <div className="card soft-card hero-quick-card" data-reveal>
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
        {data.metrics?.length ? (
          <div className="hero-metrics">
            {data.metrics.map((metric) => (
              <div className="hero-metric" key={metric.label} data-reveal>
                <span
                  className="hero-metric__value"
                  data-count={metric.value}
                  data-suffix={metric.suffix ?? ''}
                >
                  {/* Default to the real number so it's correct even if the
                      count-up (which fires on scroll-into-view) never runs. */}
                  {metric.value}
                  {metric.suffix ?? ''}
                </span>
                <span className="hero-metric__label">{metric.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        {data.stats?.length ? (
          <div className="hero-stats">
            {data.stats.map((stat) => (
              <div className="hero-stat" key={stat.label} data-reveal>
                <span className="hero-stat__label">{stat.label}</span>
                <span className="hero-stat__value">{stat.value}</span>
                {stat.detail ? <span className="hero-stat__detail">{stat.detail}</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default HomePage;
