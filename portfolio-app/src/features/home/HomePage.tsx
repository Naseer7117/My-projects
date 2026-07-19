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
import { useIntroNarration } from 'hooks/interactions/useIntroNarration';
import { useSetCompanionHandoff } from 'hooks/interactions/CompanionContext';
import { useCompanionContextBeat } from 'hooks/interactions/useCompanionContextBeat';
import { companionSizeFor } from 'lib/companionConfig';
import IntroCaptions from 'components/effects/IntroCaptions';

const PlayIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

/** Builds the intro narration script from the site's own content — stays in
 * sync automatically if the name/role/tagline ever changes in portfolio.ts. */
function buildIntroScript(data: HeroContent): string {
  return `Hi, I'm ${data.name}, a ${data.role}. ${data.tagline} ${data.introduction} Scroll down to see my work.`;
}

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

  const introScript = React.useMemo(() => buildIntroScript(data), [data]);
  const narration = useIntroNarration(introScript);
  const introOpen = narration.playing || narration.paused;
  const handleToggleIntro = React.useCallback(() => {
    if (narration.playing) {
      narration.pause();
    } else {
      narration.play();
    }
  }, [narration]);

  // Tell the globally-roaming companion (rendered once in App.tsx) to anchor
  // itself at the hero photo and "talk" while narration plays, then hand
  // roaming back once it stops. See CompanionContext for why this is a
  // handoff rather than the character living in this page.
  const portraitWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const setCompanionHandoff = useSetCompanionHandoff();
  React.useEffect(() => {
    if (!narration.playing) {
      setCompanionHandoff({ talking: false, anchor: null });
      return;
    }
    const updateAnchor = () => {
      const rect = portraitWrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const half = companionSizeFor(window.innerWidth) / 2;
      setCompanionHandoff({
        talking: true,
        anchor: { x: rect.left + rect.width / 2 - half, y: rect.top - half },
      });
    };
    // Re-measure on scroll/resize, not just once at play-start — the portrait
    // is `position: fixed`-relative, so its viewport position genuinely
    // changes if the visitor scrolls or resizes while narration is playing.
    updateAnchor();
    window.addEventListener('scroll', updateAnchor, { passive: true });
    window.addEventListener('resize', updateAnchor);
    return () => {
      window.removeEventListener('scroll', updateAnchor);
      window.removeEventListener('resize', updateAnchor);
    };
  }, [narration.playing, setCompanionHandoff]);
  // Clear the handoff on unmount (route change away from Home) so the
  // companion doesn't stay stuck "talking" with speech already cancelled.
  React.useEffect(() => {
    return () => setCompanionHandoff({ talking: false, anchor: null });
  }, [setCompanionHandoff]);

  // Context beat (§5): peek near the portrait on arrival — but only when
  // narration is NOT already playing, since `talking` always outranks a
  // context beat anyway and firing the request unconditionally would just
  // be immediately shadowed most of the time narration auto-starts. Guarded
  // the same once-per-landing way every other page's beat is (see
  // useCompanionContextBeat.ts).
  useCompanionContextBeat(
    'home',
    '.hero-portrait-wrapper',
    'peeking',
    { expression: 'happy', ms: 1600, side: 'left' },
    !narration.playing
  );

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
            <div className="hero-portrait-wrapper mb-4" data-reveal ref={portraitWrapperRef}>
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
              {introOpen ? (
                <div className="hero-intro-overlay">
                  <IntroCaptions words={narration.words} activeWordIndex={narration.activeWordIndex} />
                  {narration.playing ? (
                    <span className="hero-intro-scroll-cue" aria-hidden="true">
                      Scroll for more ↓
                    </span>
                  ) : null}
                </div>
              ) : null}
              {narration.supported ? (
                <button
                  type="button"
                  className={`hero-intro-toggle${narration.playing ? ' hero-intro-toggle--playing' : ''}`}
                  onClick={handleToggleIntro}
                  aria-pressed={introOpen}
                  aria-label={narration.playing ? 'Pause introduction' : 'Play introduction'}
                >
                  <span className="hero-intro-toggle__icon">
                    {narration.playing ? <PauseIcon /> : <PlayIcon />}
                  </span>
                  <span className="hero-intro-toggle__label">
                    {narration.playing ? 'Pause' : 'Play intro'}
                  </span>
                </button>
              ) : null}
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
