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
// The portrait photos (real headshots, cropped to the 4:5 hero frame and
// optimised to WebP). `heroPortraitMain` is the resting portrait; the rest cycle
// as a slideshow when you hover the photo. To swap one, replace the file in
// src/images/ or change an import line here.
import heroPortraitMain from '../images/hero-main.webp';
import heroPortrait1 from '../images/hero-1.webp';
import heroPortrait2 from '../images/hero-2.webp';
import heroPortrait3 from '../images/hero-3.webp';
import heroPortrait4 from '../images/hero-4.webp';
import heroPortrait5 from '../images/hero-5.webp';
import heroPortrait6 from '../images/hero-6.webp';
import heroPortrait7 from '../images/hero-7.webp';
import heroPortrait8 from '../images/hero-8.webp';

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
    tagline: 'Java & Spring Boot backend engineer — now building data science skills in the UK.',
    summary:
      'London-based software engineer. I shipped 24+ production REST APIs in Java 17 / Spring Boot for an education platform serving 500,000+ users, and automated the tests that saved my team 11+ hours a week. Now reading an MSc in Data Science & Analytics.',
    introduction:
      'I design REST APIs, model the SQL behind them, automate the tests, and ship through CI/CD — a year of it in production at SIA Publishers, in a six-person Agile team. I am now pairing that engineering foundation with Python, statistics and machine learning on my MSc, and looking for a placement year where I can do both.',
    photo: {
      src: heroPortraitMain,
      alt: 'Portrait of Naseeruddin Shaik',
      gallery: [
        heroPortrait1,
        heroPortrait6,
        heroPortrait7,
        heroPortrait5,
        heroPortrait2,
        heroPortrait3,
        heroPortrait4,
        heroPortrait8,
      ],
      slideshowIntervalMs: 1500,
      slideshowFadeMs: 700,
    },
    spotlight: [
      {
        title: 'Experience & education',
        description: 'A year of production Java at SIA Publishers, a B.Tech, and an MSc in Data Science (2028).',
        route: 'about',
      },
      {
        title: 'Technical skills',
        description: 'Java 17 · Spring Boot · PostgreSQL · Selenium · CI/CD — plus Python, R and SQL for data.',
        route: 'skills',
      },
      {
        title: 'Selected work',
        description: 'Production APIs, automated test suites, and this site — built in React 19 and TypeScript.',
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
    // Credibility metrics. These are deliberately about EXPERIENCE, not tool
    // counts — "15+ technologies" reads as shallow to an experienced reviewer,
    // whereas "1 year in production" is a fact they can interview against.
    metrics: [
      { value: 24, suffix: '+', label: 'Production REST APIs shipped' },
      { value: 500, suffix: 'k+', label: 'Users on the platform I built for' },
      { value: 11, suffix: '+ hrs', label: 'Manual testing saved per week' },
      { value: 40, suffix: 'h', label: 'Available per week (placement 2027)' },
    ],
    availabilityNote:
      'London-based · Seeking a full-time placement year starting 25 Jan – 26 Feb 2027 (University of Hertfordshire sandwich MSc). Eligible to work 40 hrs/week during placement. Offers need confirming by 2 Dec 2026 — university approval takes 6–8 weeks.',
    // Recruiter documents, served from public/docs/.
    cvUrl: '/docs/Naseeruddin-Shaik-CV.pdf',
    coverLetterUrl: '/docs/Naseeruddin-Shaik-Cover-Letter.pdf',
    placementLetterUrl: '/docs/UH-Placement-Letter.jpg',
  },
  about: {
    headline: 'Backend engineer with production Java experience, now specialising in data science',
    biography: [
      'I am a software engineer based in London, currently reading an MSc in Data Science & Analytics at the University of Hertfordshire (a sandwich degree, graduating 2028). I am on a Student visa and hold a university placement-year letter, which means I can work 40 hours a week in an IT or data science role — so I am available now for a placement, internship or industrial year, not only after graduation.',
      'Before moving to the UK I spent a year as an Application Developer at SIA Publishers and Distributors in Hyderabad, writing production Java 17 and Spring Boot. That meant designing REST APIs, modelling data in PostgreSQL and SQL Server, automating the test suite with Selenium, shipping through CI/CD, and being on the hook when something broke in production. Before that I worked as a freelance application tester, which is where the test-first habit came from.',
      'On the MSc I work in Python, Jupyter, R and R Studio across statistics and machine-learning fundamentals. I also hold certifications in Cyber Security, Microsoft Azure, AWS, JavaScript, Salesforce and Data Visualization, and speak English (C1/C2), Urdu, Telugu and Hindi. What I am looking for is a team where I can keep writing backend code while growing into data — and I am happy to start on either side.',
    ],
    timeline: [
      {
        period: '2026 — 2028',
        title: 'MSc, Data Science & Analytics',
        organization: 'University of Hertfordshire, UK',
        details: [
          'Postgraduate study in data science: statistics, machine-learning fundamentals, and analytics.',
          'Hands-on with Python and Jupyter Notebook, plus statistical modelling in R and R Studio.',
          'Holding a university placement-year letter — available 40 hrs/week for an IT or data role now.',
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
        title: 'Enterprise Application Backend',
        subtitle: 'Java 17 · Spring Boot · PostgreSQL — SIA Publishers (12 months, production)',
        description:
          'A year on the server side of an educational platform serving 500,000+ users, in a six-person Agile team. I owned REST endpoints end to end — from the API contract, through the Spring service layer, down to the schema — and stayed on them once they were live.',
        contributions: [
          'Built 24+ production REST APIs (GET, POST, PUT, DELETE) in Java 17 / Spring Boot with Hibernate and JPA persistence.',
          'Managed live PostgreSQL and SQL Server databases — validating data flow and integrity, and resolving real user data issues in production (misplaced books, incorrect orders).',
          'Wrote the SQL reporting queries that gave the operations team accurate, real-time sales and production figures.',
          'Took production incidents: reproduced the fault, traced it through service and database layers, and shipped the fix.',
        ],
        outcomes: [
          '24+ live endpoints serving a platform used by over half a million people.',
          'Operations got real-time business figures instead of waiting on manual reporting.',
          'Practical command of the whole request → service → database path, including when it breaks in production.',
        ],
        tech: ['Java 17', 'Spring Boot', 'Hibernate / JPA', 'PostgreSQL', 'SQL Server', 'CI/CD'],
        repoUrl: GITHUB_URL,
      },
      {
        title: 'Automated Test Suite',
        subtitle: 'Selenium · Java & Python — saved the team 11+ hours a week',
        description:
          'Test automation across web and mobile applications, begun in freelance QA work and carried into my role at SIA. The goal was simple: stop shipping regressions that a machine could have caught — and stop burning the team’s week on manual passes.',
        contributions: [
          'Automated 12+ business-logic tests with Selenium (Java and Python) and wired them into the CI/CD release path.',
          'Tested REST APIs directly and validated that what the API returned matched what landed in the database.',
          'Documented defects with clear reproduction steps and retested fixes to confirm resolution.',
        ],
        outcomes: [
          'Saved the team an estimated 11+ hours of manual testing every week.',
          'Regressions caught in the pipeline rather than by users after release.',
          'A repeatable suite the team ran on every change instead of ad-hoc manual passes.',
        ],
        tech: ['Selenium', 'Java', 'Python', 'REST', 'Integration testing'],
        repoUrl: GITHUB_URL,
      },
      {
        title: 'Developer Portfolio Platform',
        subtitle: 'React 19 + TypeScript single-page application',
        description:
          'The site you are reading. Built from scratch — no template, no UI kit — as a working demonstration of front-end engineering: a scroll-choreographed intro, a cursor-reactive particle canvas, and a typed content model that drives every page.',
        contributions: [
          'Architected ~40 typed React components driven from a single content source file.',
          'Hand-rolled the motion layer in GSAP: scroll-pinned sequences, reveal choreography, 3D tilt and a reactive particle canvas.',
          'Built a responsive dark/light design system that degrades properly on low-power devices and under reduced-motion.',
        ],
        outcomes: [
          'Runs the full experience on desktop and adapts it for phones rather than dropping it.',
          'All page content changes from one typed file — the type system catches mistakes at build time.',
          'Ships green through TypeScript, ESLint, tests and a production build.',
        ],
        tech: ['React 19', 'TypeScript', 'GSAP', 'Canvas', 'CSS'],
        repoUrl: 'https://github.com/Naseer7117/My-projects/tree/main/portfolio-app',
      },
    ],
    labs: [
      {
        title: 'Data Visualization & SQL',
        description:
          'Reporting queries and dashboards behind internal tooling at SIA, plus a TCS data-visualization internship — the work that pulled me toward data science.',
        linkLabel: 'Discuss this work',
        linkHref: '#contact',
      },
      {
        title: 'Cloud & Certifications',
        description:
          'Certified across Microsoft Azure and AWS, with further certifications in Cyber Security, Salesforce and JavaScript — deployment and administration, not just theory.',
        linkLabel: 'See certifications',
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
      'Seeking a full-time placement year starting between 25 January and 26 February 2027, running to 24 September 2027 (minimum 30 working weeks) as the sandwich year of my MSc. I can work 40 hrs/week during it. Please note offers need to be confirmed by 2 December 2026 — university approval takes 6–8 weeks. London-based, open to hybrid, remote or on-site, happy to relocate. I reply within a day.',
    documents: [
      {
        label: 'Download CV (PDF)',
        href: '/docs/Naseeruddin-Shaik-CV.pdf',
        note: 'One page · ready to forward or attach to an ATS record',
      },
      {
        label: 'Cover letter (PDF)',
        href: '/docs/Naseeruddin-Shaik-Cover-Letter.pdf',
        note: 'Template version — I tailor it per role',
      },
      {
        label: 'University placement letter',
        href: '/docs/UH-Placement-Letter.jpg',
        note: 'University of Hertfordshire · confirms the placement dates and full-time hours',
      },
    ],
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
    socials: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
      { label: 'Email', href: `mailto:${EMAIL}` },
      { label: 'Phone', href: 'tel:+918143214862' },
    ],
    schedule: [
      { label: 'Right to work', slots: 'Student visa + university placement letter — 40 hrs/week in IT or data science' },
      { label: 'Start date', slots: 'Available immediately for a placement, internship or graduate role' },
      { label: 'Intro call', slots: '30 minutes to talk through the role — or a technical walk-through of my code' },
    ],
  },

  // Footer social buttons. Paste your real profile URLs here. A value of '#'
  // shows the icon as a not-yet-linked placeholder (it activates once you add a
  // URL). Verify the Instagram/Facebook links below — replace if they're wrong.
  socialMedia: [
    { platform: 'github', href: GITHUB_URL },
    { platform: 'instagram', href: 'https://www.instagram.com/u.s.t.a.a.d___7117/' },
    { platform: 'facebook', href: 'https://m.facebook.com/naseeruddin.shaikh.127/' },
    { platform: 'youtube', href: '#' },
  ],
};
