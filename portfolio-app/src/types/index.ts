/*
 * types.ts — THE "SHAPES" of the content.
 *
 * These TypeScript types describe exactly what fields the content in
 * data/portfolioData.ts must have, and whether each is text (string), a number,
 * or a list ([]). If you add a field to the content that isn't described here,
 * TypeScript will show an error — that's how it protects you from typos.
 *
 * A `?` after a field name (e.g. `detail?: string`) means that field is
 * OPTIONAL — you can leave it out.
 */

// The five pages. If you add a new page tab, add its name here too.
export type RouteKey = 'home' | 'about' | 'skills' | 'projects' | 'contact';

export type NavItem = {
  label: string;
  route: RouteKey;
};

export type Stat = {
  label: string;
  value: string;
  detail?: string;
};

export type Metric = {
  value: number;
  suffix?: string;
  label: string;
};

export type Spotlight = {
  title: string;
  description: string;
  route: RouteKey;
};

export type TimelineItem = {
  period: string;
  title: string;
  organization: string;
  details: string[];
};

export type ValueHighlight = {
  title: string;
  description: string;
};

export type SkillCluster = {
  title: string;
  summary: string;
  focus: string[];
};

export type ToolchainItem = {
  label: string;
  items: string[];
};

export type Workflow = {
  title: string;
  description: string;
};

export type Credential = {
  title: string;
  issuer: string;
  kind: string; // e.g. "Certification" or "Internship"
};

export type Education = {
  degree: string;
  institution: string;
  period: string;
  detail?: string;
};

export type Language = {
  name: string;
  level: string;
};

export type FeaturedProject = {
  title: string;
  subtitle: string;
  description: string;
  contributions: string[];
  outcomes: string[];
  tech: string[];
  repoUrl?: string;
  liveUrl?: string;
};

export type LabProject = {
  title: string;
  description: string;
  linkLabel: string;
  linkHref: string;
};

export type Service = {
  title: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export type ScheduleItem = {
  label: string;
  slots: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

// Icon social buttons shown in the footer. Set href to '#' (or '') to leave a
// button as a not-yet-linked placeholder; paste your real URL to activate it.
export type SocialMedia = {
  platform: 'facebook' | 'instagram' | 'github' | 'youtube';
  href: string;
};

export type HeroContent = {
  name: string;
  role: string;
  tagline: string;
  summary: string;
  introduction: string;
  photo: {
    src: string;
    alt: string;
    gallery?: string[];
    slideshowIntervalMs?: number;
    slideshowFadeMs?: number;
  };
  spotlight: Spotlight[];
  socials?: SocialLink[];
  stats: Stat[];
  metrics?: Metric[];
  availabilityNote: string;
};

export type AboutContent = {
  headline: string;
  biography: string[];
  timeline: TimelineItem[];
  values: ValueHighlight[];
  education: Education[];
  languages: Language[];
};

export type SkillsContent = {
  clusters: SkillCluster[];
  toolchain: ToolchainItem[];
  workflows: Workflow[];
  certifications: Credential[];
  strengths: string[];
};

export type ProjectsContent = {
  featured: FeaturedProject[];
  labs: LabProject[];
  process: Workflow[];
};

export type ContactContent = {
  email: string;
  location: string;
  availability: string;
  services: Service[];
  testimonials: Testimonial[];
  socials: SocialLink[];
  schedule: ScheduleItem[];
};

export type PortfolioData = {
  hero: HeroContent;
  about: AboutContent;
  skills: SkillsContent;
  projects: ProjectsContent;
  contact: ContactContent;
  socialMedia: SocialMedia[];
};
