/*
 * ============================================================================
 *  ⭐ portfolioData.ts — THIS IS THE FILE YOU EDIT to change the website's text.
 * ============================================================================
 *
 * Every word shown on the site is stored here, grouped by page:
 *
 *   portfolioData = {
 *     hero:     { ... }   // Home page  (name, tagline, photo, metrics, stats)
 *     about:    { ... }   // About page (biography + career timeline + values)
 *     skills:   { ... }   // Skills page (skill groups + tool list + workflows)
 *     projects: { ... }   // Projects page (the project cards + labs + process)
 *     contact:  { ... }   // Contact page (email, location, services, links)
 *   }
 *
 * HOW TO EDIT:
 *   - Change text  -> find the field and edit the text inside the quotes.
 *   - Add an item  -> copy an existing { ... } block inside a list and edit it.
 *   - The fields you may use are defined in ../types.ts. If you mistype a field
 *     name, TypeScript will underline it in red.
 *
 * The constants below (GITHUB_URL, etc.) are reused in several places, so you
 * only have to update a link once.
 */
import { PortfolioData, NavItem } from 'types';
// The portrait photos. To use your own, drop a file in src/images/ and either
// overwrite one of these files or add a new `import` line here.
import heroPortraitMain from '../images/mewithdesk1.webp';
import heroPortrait1 from '../images/AI-Portrait1.webp';
import heroPortrait2 from '../images/AI-Portrait2.webp';
import heroPortrait3 from '../images/AI-Portrait3.webp';
import heroPortrait4 from '../images/AI-Portrait4.webp';
import heroPortrait5 from '../images/AI-Portrait5.webp';
import heroPortrait6 from '../images/AI-Portrait6.webp';
import heroPortrait7 from '../images/AI-Portrait7.webp';

const GITHUB_URL = 'https://github.com/Naseer7117';
const LINKEDIN_URL = 'https://www.linkedin.com/in/naseeruddin-shaik-7a3104249/';
const EMAIL = 'naseer3504581@gmail.com';

// The top navigation menu. `label` is what the visitor sees; `route` is the
// matching page name (must be one of the RouteKey values in types.ts).
export const navItems: NavItem[] = [
  { label: 'Home', route: 'home' },
  { label: 'About', route: 'about' },
  { label: 'Skills', route: 'skills' },
  { label: 'Projects', route: 'projects' },
  { label: 'Contact', route: 'contact' },
];

export const portfolioData: PortfolioData = {
  hero: {
    name: 'Naseeruddin Shaik',
    role: 'Software Engineer',
    tagline: 'I build and test enterprise Java backends — and I am diving into data science.',
    summary:
      'Software engineer with a year building and supporting enterprise Java 17 and Spring Boot applications at SIA Publishers, now pursuing an MSc in Data Science & Analytics in the UK.',
    introduction:
      'I design REST APIs, model the SQL behind them, automate testing with Selenium, and ship through CI/CD. I care about clean, readable code and production systems that stay reliable — and I am expanding into data analytics and machine learning.',
    photo: {
      src: heroPortraitMain,
      alt: 'Portrait of Naseeruddin Shaik',
      gallery: [
        heroPortrait1,
        heroPortrait2,
        heroPortrait3,
        heroPortrait4,
        heroPortrait5,
        heroPortrait6,
        heroPortrait7,
      ],
      slideshowIntervalMs: 1500,
      slideshowFadeMs: 700,
    },
    spotlight: [
      {
        title: 'Read the story',
        description: 'From a B.Tech in Guntur to backend engineering, and now an MSc in the UK.',
        route: 'about',
      },
      {
        title: 'Tech stack',
        description: 'Java 17, Spring Boot, SQL, Selenium, AWS, Azure — and a growing data toolkit.',
        route: 'skills',
      },
      {
        title: 'See the work',
        description: 'Enterprise APIs, test automation, and the code behind this site.',
        route: 'projects',
      },
    ],
    socials: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
      { label: 'Email', href: `mailto:${EMAIL}` },
    ],
    stats: [
      { label: 'Backend', value: 'Java 17 · Spring', detail: 'REST APIs, Hibernate / JPA' },
      { label: 'Testing', value: 'Selenium · CI/CD', detail: 'Unit, integration & E2E' },
      { label: 'Data', value: 'SQL · PostgreSQL', detail: 'Queries & visualization' },
      { label: 'Cloud', value: 'AWS · Azure', detail: 'Deployments & administration' },
    ],
    metrics: [
      { value: 6, suffix: '', label: 'Programming languages' },
      { value: 15, suffix: '+', label: 'Technologies & tools' },
      { value: 5, suffix: '+', label: 'Certifications & internships' },
      { value: 2, suffix: '', label: 'Cloud platforms (AWS, Azure)' },
    ],
    availabilityNote: 'Open to graduate & entry-level software and data roles — hybrid, remote, or on-site.',
  },
  about: {
    headline: 'Backend-focused software engineer, now expanding into data science',
    biography: [
      'I am Naseeruddin Shaik — a software engineer originally from Guntur, India, now based in the UK. I hold a B.Tech in Computer Science and spent a year as an Application Developer at SIA Publishers and Distributors, building and supporting enterprise Java and Spring Boot applications.',
      'My core work is backend: designing REST APIs, modelling data in PostgreSQL and SQL Server, and shipping through CI/CD pipelines. I automate testing with Selenium — functional, integration, and end-to-end — carried over from earlier freelance QA work, and I write SQL for reporting and data visualization.',
      'I am currently pursuing an MSc in Data Science and Analytics at the University of Hertfordshire, working with Python, Jupyter, R, and R Studio. I hold certifications and internships in Cyber Security, Cloud (Microsoft Azure & AWS), JavaScript, Salesforce, and Data Visualization, and I am fluent in English (C1/C2) alongside Urdu, Telugu, and Hindi. I am actively seeking graduate and entry-level roles in software and data.',
    ],
    timeline: [
      {
        period: '2026 — 2028',
        title: 'MSc, Data Science & Analytics',
        organization: 'University of Hertfordshire, UK',
        details: [
          'Postgraduate study in data science: statistics, machine-learning fundamentals, and analytics.',
          'Hands-on with Python and Jupyter Notebook, plus statistical modelling in R and R Studio.',
          'Building on a software-engineering foundation to work across both data and backend.',
        ],
      },
      {
        period: '2025',
        title: 'Application Developer',
        organization: 'SIA Publishers and Distributors · Hyderabad',
        details: [
          'Built REST APIs and Java 17 / Spring Boot backend services for enterprise applications.',
          'Managed SQL Server and PostgreSQL databases and wrote queries for reporting and data visualization.',
          'Automated unit, integration, and end-to-end tests with Selenium and shipped through CI/CD pipelines.',
          'Investigated and resolved backend system issues and production incidents.',
        ],
      },
      {
        period: '2024',
        title: 'Freelance Application Tester',
        organization: 'Self-employed · Hyderabad',
        details: [
          'Ran functional and integration testing across web and mobile applications.',
          'Tested APIs and validated backend data flows against the database.',
          'Checked application performance and UI alignment across releases.',
        ],
      },
      {
        period: '2020 — 2024',
        title: 'B.Tech, Computer Science Engineering',
        organization: 'Kallam Haranadhareddy Institute of Technology',
        details: [
          'Computer-science foundation: Java, Python, C, C++, SQL, and web technologies.',
          'Coursework across data structures, databases, networking, and mathematics.',
          'Graduated 2024 before moving into professional software development.',
        ],
      },
    ],
    values: [
      {
        title: 'Readable code first',
        description: 'I optimize for the next person who reads the code — clear names, small units, honest comments.',
      },
      {
        title: 'Test before you ship',
        description: 'Automated checks from unit to end-to-end catch regressions before users ever see them.',
      },
      {
        title: 'Always learning',
        description: 'From backend engineering into data science — new tools and better patterns sharpen every build.',
      },
    ],
    education: [
      {
        degree: 'MSc, Data Science & Analytics',
        institution: 'University of Hertfordshire',
        period: '2026 — 2028',
        detail: 'United Kingdom · Python, Jupyter, R & R Studio, statistics and machine-learning fundamentals.',
      },
      {
        degree: 'B.Tech, Computer Science Engineering',
        institution: 'Kallam Haranadhareddy Institute of Technology',
        period: '2020 — 2024',
        detail: 'Guntur, India · Grade 7.8 · Java, Python, C/C++, SQL, data structures & networking.',
      },
      {
        degree: 'Intermediate (Class XII), MPC',
        institution: 'Sri Chaitanya College',
        period: '2018 — 2020',
        detail: 'Guntur, India · Mathematics, Physics & Chemistry.',
      },
      {
        degree: 'SSC (Class X)',
        institution: 'St Laurels High School',
        period: '2017 — 2018',
        detail: 'Guntur, India.',
      },
    ],
    languages: [
      { name: 'English', level: 'Professional (C1 / C2)' },
      { name: 'Urdu', level: 'Native' },
      { name: 'Telugu', level: 'Native' },
      { name: 'Hindi', level: 'Native' },
      { name: 'Tamil', level: 'Basic (A2)' },
    ],
  },
  skills: {
    clusters: [
      {
        title: 'Backend Engineering',
        summary: 'Java 17 and Spring Boot services and REST APIs that hold up in production.',
        focus: [
          'REST APIs with Java 17 & Spring Boot',
          'Hibernate, JPA, JDBC & JAX-RS',
          'Relational data in PostgreSQL & SQL Server',
          'Builds with Maven & Gradle',
        ],
      },
      {
        title: 'Testing & Delivery',
        summary: 'Automated testing and CI/CD to ship changes with confidence.',
        focus: [
          'Selenium automation (Java & Python)',
          'Unit, integration & end-to-end testing',
          'CI/CD pipelines',
          'API testing & backend data validation',
        ],
      },
      {
        title: 'Data, Cloud & Foundations',
        summary: 'SQL analytics, cloud platforms, and a growing data-science toolkit.',
        focus: [
          'SQL queries & data visualization',
          'AWS & Microsoft Azure',
          'Python, Jupyter, R & R Studio',
          'Git & version control',
        ],
      },
    ],
    toolchain: [
      {
        label: 'Languages',
        items: ['Java 17', 'Python', 'JavaScript', 'SQL', 'C / C++'],
      },
      {
        label: 'Backend & APIs',
        items: ['Spring Boot', 'Hibernate / JPA', 'REST & JAX-RS', 'Maven / Gradle'],
      },
      {
        label: 'Testing & DevOps',
        items: ['Selenium', 'CI/CD pipelines', 'Git & GitHub', 'Unit / E2E testing'],
      },
      {
        label: 'Data & Cloud',
        items: ['PostgreSQL', 'SQL Server', 'AWS & Azure', 'Python · Jupyter · R'],
      },
    ],
    workflows: [
      {
        title: 'Version control & CI/CD',
        description: 'Branch, review, and ship through automated build-and-deploy pipelines.',
      },
      {
        title: 'Test-first mindset',
        description: 'Automate the checks — unit to end-to-end — and validate data before shipping.',
      },
      {
        title: 'Learning in the open',
        description: 'MSc study plus certifications keep the toolkit growing across software and data.',
      },
    ],
    certifications: [
      { title: 'Cybersecurity', issuer: 'Cisco', kind: 'Virtual Internship' },
      { title: 'JavaScript Essentials', issuer: 'Cisco', kind: 'Certification' },
      { title: 'Networking & Packet Tracer', issuer: 'Cisco', kind: 'Certification' },
      { title: 'Azure Administrator', issuer: 'Microsoft', kind: 'Training' },
      { title: 'Cloud Foundations', issuer: 'AWS', kind: 'Labs' },
      { title: 'Trailhead — Admin & Developer', issuer: 'Salesforce', kind: 'Certification' },
      { title: 'Data Visualization', issuer: 'TCS iON', kind: 'Virtual Internship' },
    ],
    strengths: [
      'Problem solving',
      'Analytical thinking',
      'Communication',
      'Stakeholder management',
      'Time management',
      'Adaptability',
      'Teamwork',
      'Critical thinking',
    ],
  },
  projects: {
    featured: [
      {
        title: 'Enterprise Backend & APIs',
        subtitle: 'Java 17 · Spring Boot · REST — SIA Publishers',
        description:
          'A year building and supporting enterprise application backends: designing REST APIs, modelling data, and shipping through CI/CD at SIA Publishers and Distributors.',
        contributions: [
          'Developed REST APIs and Spring Boot services with Hibernate/JPA persistence.',
          'Designed and queried SQL Server and PostgreSQL databases, including reporting queries.',
          'Set up CI/CD pipelines and resolved backend and production incidents.',
        ],
        outcomes: [
          'Reliable API endpoints powering enterprise applications.',
          'Faster, safer releases through automated build and deploy.',
          'A deeper command of the full request → service → database path.',
        ],
        tech: ['Java 17', 'Spring Boot', 'PostgreSQL', 'SQL Server', 'CI/CD'],
        repoUrl: GITHUB_URL,
      },
      {
        title: 'Test Automation with Selenium',
        subtitle: 'Functional, integration & end-to-end QA',
        description:
          'Automated testing across web and mobile applications — validating APIs, backend data flows, performance, and UI — from freelance QA work and continued at SIA.',
        contributions: [
          'Built Selenium suites (Java & Python) for functional and integration testing.',
          'Tested APIs and validated backend data flows against the database.',
          'Checked application performance and UI alignment across releases.',
        ],
        outcomes: [
          'Caught regressions before they reached production.',
          'Repeatable test coverage for web and mobile apps.',
          'A test-first habit carried into every build.',
        ],
        tech: ['Selenium', 'Java', 'Python', 'REST', 'Integration testing'],
        repoUrl: GITHUB_URL,
      },
      {
        title: 'Developer Portfolio Platform',
        subtitle: 'React 19 + TypeScript single-page application',
        description:
          'This site — a hand-built React 19 + TypeScript SPA with a cursor-reactive particle constellation, custom cursor, scroll choreography, and a dark cinematic design system, no template.',
        contributions: [
          'Architected typed React components driven by a single content model.',
          'Hand-rolled the motion engine: scroll reveals, 3D tilt, magnetic buttons, and a reactive particle canvas.',
          'Built a fully responsive dark design system that respects reduced-motion.',
        ],
        outcomes: [
          'A live demonstration of my React and TypeScript work.',
          'Loads fast and works from small phones to widescreen.',
          'All content updates from one typed file.',
        ],
        tech: ['React 19', 'TypeScript', 'Canvas', 'CSS'],
        repoUrl: 'https://github.com/Naseer7117/My-projects/tree/main/portfolio-app',
      },
    ],
    labs: [
      {
        title: 'Data Visualization & SQL',
        description: 'Reporting queries and dashboards turning raw data into insight, from SIA work and a TCS data-visualization internship.',
        linkLabel: 'Ask me about it',
        linkHref: '#contact',
      },
      {
        title: 'Cloud & Certifications',
        description: 'Hands-on labs across AWS and Microsoft Azure, plus certifications in Cyber Security, Salesforce, and JavaScript.',
        linkLabel: 'Request a walkthrough',
        linkHref: '#contact',
      },
    ],
    process: [
      {
        title: 'Plan',
        description: 'Understand the problem, agree on scope, and sketch the data model and API before writing code.',
      },
      {
        title: 'Build',
        description: 'Work in small, reviewable commits — backend and tests together — validating each piece as it lands.',
      },
      {
        title: 'Ship',
        description: 'Deploy through CI/CD, verify it runs in the real environment, and document how to run and extend it.',
      },
    ],
  },
  contact: {
    email: EMAIL,
    location: 'Thornton Heath, London, United Kingdom · Open to relocate',
    availability:
      'Open to graduate and entry-level software and data roles — hybrid, remote, or on-site. I usually reply within a day.',
    services: [
      {
        title: 'Backend & API development',
        description: 'Java 17 / Spring Boot REST APIs with a SQL data layer, built to be tested and maintained.',
      },
      {
        title: 'Test automation',
        description: 'Selenium suites and CI/CD so changes ship with confidence across web and mobile.',
      },
      {
        title: 'Data & SQL work',
        description: 'Queries, reporting, and data visualization that turn raw datasets into insight.',
      },
    ],
    testimonials: [
      {
        quote:
          'Picks up new technology quickly and turns it into working code — reliable on the fundamentals and easy to collaborate with.',
        author: 'Team Lead',
        role: 'SIA Publishers and Distributors',
      },
      {
        quote:
          'Communicates clearly, documents the work, and follows through until the change is actually shipped.',
        author: 'Project Supervisor',
        role: 'Freelance engagement',
      },
    ],
    socials: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
      { label: 'Email', href: `mailto:${EMAIL}` },
      { label: 'Phone', href: 'tel:+918143214862' },
    ],
    schedule: [
      { label: 'Intro call', slots: '30-minute chat to talk through a role or project' },
      { label: 'Technical deep-dive', slots: 'Walk through my code and how I approach the build' },
      { label: 'Start date', slots: 'Available for internships and roles alongside my MSc' },
    ],
  },
};
