import React from 'react';
import { HeroContent, RouteKey } from '../types';

const HERO_PORTRAIT_ANIMATIONS = [
  'fade',
  'slide-up',
  'slide-right',
  'slide-down',
  'slide-left',
  'zoom-in',
  'zoom-out',
  'tilt',
] as const;

type HeroPortraitAnimationKey = (typeof HERO_PORTRAIT_ANIMATIONS)[number];

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
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const slideshowTimerRef = React.useRef<number | null>(null);
  const fadeTimeoutRef = React.useRef<number | null>(null);
  const [previousImageSrc, setPreviousImageSrc] = React.useState<string | null>(null);
  const [isCrossfading, setIsCrossfading] = React.useState(false);
  const [activeAnimation, setActiveAnimation] = React.useState<HeroPortraitAnimationKey>(
    HERO_PORTRAIT_ANIMATIONS[0]
  );
  const fadeDuration = data.photo.slideshowFadeMs ?? 600;
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
  const clearFadeTimeout = React.useCallback(() => {
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);
  const stopSlideshow = React.useCallback(() => {
    if (slideshowTimerRef.current !== null) {
      window.clearInterval(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    clearFadeTimeout();
    setIsCrossfading(false);
    setPreviousImageSrc(null);
    setActiveAnimation(HERO_PORTRAIT_ANIMATIONS[0]);
  }, [clearFadeTimeout]);
  const advanceImage = React.useCallback(() => {
    if (heroImages.length <= 1) {
      return;
    }
    setActiveImageIndex((prev) => {
      const nextIndex = (prev + 1) % heroImages.length;
      const priorSrc = heroImages[prev] ?? null;
      if (priorSrc) {
        setPreviousImageSrc(priorSrc);
        setIsCrossfading(true);
        clearFadeTimeout();
        fadeTimeoutRef.current = window.setTimeout(() => {
          setIsCrossfading(false);
          setPreviousImageSrc(null);
          fadeTimeoutRef.current = null;
        }, fadeDuration);
      }
      setActiveAnimation(HERO_PORTRAIT_ANIMATIONS[nextIndex % HERO_PORTRAIT_ANIMATIONS.length]);
      return nextIndex;
    });
  }, [clearFadeTimeout, fadeDuration, heroImages]);
  const handleMouseEnterPortrait = React.useCallback(() => {
    if (heroImages.length <= 1 || slideshowTimerRef.current !== null) {
      return;
    }
    const interval = data.photo.slideshowIntervalMs ?? 1200;
    advanceImage();
    slideshowTimerRef.current = window.setInterval(() => {
      advanceImage();
    }, interval);
  }, [advanceImage, data.photo.slideshowIntervalMs, heroImages.length]);

  const handleMouseLeavePortrait = React.useCallback(() => {
    stopSlideshow();
    setActiveImageIndex(0);
    setActiveAnimation(HERO_PORTRAIT_ANIMATIONS[0]);
  }, [stopSlideshow]);

  React.useEffect(() => {
    return () => stopSlideshow();
  }, [stopSlideshow]);

  React.useEffect(() => {
    stopSlideshow();
    setActiveImageIndex(0);
    setActiveAnimation(HERO_PORTRAIT_ANIMATIONS[0]);
  }, [heroImages, stopSlideshow]);

  const activeHeroImageSrc = heroImages[activeImageIndex] ?? data.photo.src;
  const stageAnimationClass = activeAnimation ?? HERO_PORTRAIT_ANIMATIONS[0];
  const heroPortraitStageClassName = [
    'hero-portrait-stage',
    `animation-${stageAnimationClass}`,
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
          <div className="col-lg-5 col-xl-4 ms-lg-auto hero-sidebar">
            <div className="hero-portrait-wrapper mb-4">
              <div
                className={heroPortraitStageClassName}
                onMouseEnter={handleMouseEnterPortrait}
                onMouseLeave={handleMouseLeavePortrait}
                style={portraitStageStyle}
              >
                {previousImageSrc ? (
                  <img
                    className="hero-portrait-img hero-portrait-img--previous"
                    src={previousImageSrc}
                    alt=""
                    aria-hidden="true"
                  />
                ) : null}
                <img
                  className="hero-portrait-img hero-portrait-img--current"
                  src={activeHeroImageSrc}
                  alt={data.photo.alt}
                />
              </div>
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
