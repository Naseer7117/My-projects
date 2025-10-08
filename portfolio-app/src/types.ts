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
  proficiency: number;
};

export type ToolchainItem = {
  label: string;
  items: string[];
};

export type Workflow = {
  title: string;
  description: string;
};

export type FeaturedProject = {
  title: string;
  subtitle: string;
  description: string;
  contributions: string[];
  outcomes: string[];
  tech: string[];
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
  availabilityNote: string;
};

export type AboutContent = {
  headline: string;
  biography: string[];
  timeline: TimelineItem[];
  values: ValueHighlight[];
};

export type SkillsContent = {
  clusters: SkillCluster[];
  toolchain: ToolchainItem[];
  workflows: Workflow[];
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
};
