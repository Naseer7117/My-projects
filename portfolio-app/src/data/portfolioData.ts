import { PortfolioData, NavItem } from '../types';

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
    role: 'Software Support Engineer',
    tagline: 'Support-focused engineer blending problem solving and service excellence.',
    summary:
      'Early-career engineer delivering reliable application support, process improvements, and stakeholder communication across cloud and on-prem environments.',
    introduction:
      'I combine analytical thinking, structured documentation, and collaborative communication to keep services healthy, resolve incidents, and turn feedback into measurable improvements.',
    photo: {
      src: 'https://your-domain.example.com/path/to/portrait.jpg',
      alt: 'Portrait of Naseeruddin Shaik',
    },
    spotlight: [
      {
        title: 'Experience & Training',
        description: 'Explore my internships, freelance engagements, and certifications.',
        route: 'about',
      },
      {
        title: 'Technical Toolkit',
        description: 'Review the languages, frameworks, and support workflows I rely on.',
        route: 'skills',
      },
      {
        title: 'Collaborate with me',
        description: 'Connect to discuss how I can stabilize and scale your support operations.',
        route: 'contact',
      },
    ],
    socials: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/naseeruddin-shaik' },
      { label: 'Instagram', href: 'https://www.instagram.com/u.s.t.a.a.d___7117/' },
      { label: 'Facebook', href: '#' },
    ],
    stats: [
      { label: 'Hands-on support', value: '8+ months', detail: 'Service desk & application support rotations' },
      { label: 'Freelance delivery', value: '1 year', detail: 'Process improvement and knowledge base projects' },
      { label: 'Certifications', value: '5+', detail: 'Cisco, Microsoft Azure, Salesforce, TCS' },
    ],
    availabilityNote: 'Open to full-time software support roles and freelance collaborations.',
  },
  about: {
    headline: 'Software support engineer focused on dependable customer experiences',
    biography: [
      'I am a Software Support Engineer from Guntur, India with eight months of industry experience complemented by a year of freelance work. I thrive on diagnosing application issues, documenting fixes, and keeping stakeholders informed.',
      'My toolkit spans Java, SQL, Spring Boot, AWS EC2, and web technologies, and I pair that with strong communication, negotiation, and time management skills. I enjoy creating structured playbooks that help teams stay aligned on SLAs.',
      'Certifications from Cisco, Microsoft, Salesforce, and TCS keep me current on cybersecurity, cloud administration, JavaScript essentials, and data visualization best practices.',
    ],
    timeline: [
      {
        period: '2024 - Present',
        title: 'Freelance Software Support Engineer',
        organization: 'Independent engagements',
        details: [
          'Support SME clients by triaging incidents, coordinating fixes, and closing feedback loops with stakeholders.',
          'Automate recurring checks and update knowledge bases to reduce repeat tickets by focusing on root causes.',
          'Track KPIs such as resolution time and customer satisfaction to guide process improvements.',
        ],
      },
      {
        period: '2023 - 2024',
        title: 'Software Support Engineer (Trainee)',
        organization: 'IT services organization',
        details: [
          'Completed an 8-month rotation covering application support, ticket management, and post-incident reviews.',
          'Collaborated with cross-functional teams to communicate updates and ensure SLA adherence.',
          'Documented troubleshooting steps and best practices to accelerate future resolutions.',
        ],
      },
      {
        period: '2022 - 2023',
        title: 'Technical Internships & Certifications',
        organization: 'Cisco | Microsoft | Salesforce | TCS',
        details: [
          'Cisco Cyber Security, Packet Tracer, and JavaScript Essentials virtual internships.',
          'Microsoft Azure Administrator Associate training focused on resource governance and monitoring.',
          'Salesforce Trailhead administrator and developer journeys covering CRM customization.',
          'TCS remote internship on data visualization and KPI storytelling with Power BI.',
        ],
      },
    ],
    values: [
      {
        title: 'Customer-first support',
        description: 'Every response aims to restore service quickly while keeping users informed and confident.',
      },
      {
        title: 'Continuous learning mindset',
        description: 'Certifications and mentorship keep my technical and soft skills sharp for emerging challenges.',
      },
      {
        title: 'Transparent collaboration',
        description: 'Clear updates, structured documentation, and stakeholder alignment build lasting trust.',
      },
    ],
  },
  skills: {
    clusters: [
      {
        title: 'Application Support & Operations',
        summary: 'Delivering reliable L1/L2 support, knowledge management, and incident reporting.',
        focus: [
          'Incident triage and SLA tracking',
          'Knowledge base curation and documentation',
          'Stakeholder communication & escalation',
          'Root-cause analysis with actionable follow-up',
        ],
        proficiency: 88,
      },
      {
        title: 'Backend & Cloud Fundamentals',
        summary: 'Applying Java, SQL, and cloud services to troubleshoot and extend business applications.',
        focus: [
          'Java (Core) and Spring Boot services',
          'Database design with SQL & PostgreSQL',
          'AWS EC2 provisioning and monitoring basics',
          'REST API testing with Postman & automation scripts',
        ],
        proficiency: 82,
      },
      {
        title: 'Professional Strengths',
        summary: 'Soft skills that keep teams coordinated and projects moving forward.',
        focus: [
          'Process planning and time management',
          'Analytical problem solving & reasoning',
          'Negotiation and stakeholder alignment',
          'Collaborative teamwork and mentoring peers',
        ],
        proficiency: 90,
      },
    ],
    toolchain: [
      {
        label: 'Languages & Querying',
        items: ['C', 'Java (Core)', 'SQL', 'PostgreSQL'],
      },
      {
        label: 'Frameworks & Web',
        items: ['Spring Framework', 'Spring Boot', 'HTML', 'CSS'],
      },
      {
        label: 'Cloud & Platforms',
        items: ['AWS EC2', 'Microsoft Azure Administration', 'Salesforce Trailhead labs'],
      },
      {
        label: 'Support & Analytics',
        items: ['Service ticketing workflows', 'Confluence / knowledge base tools', 'Power BI dashboards', 'MS Office 365'],
      },
    ],
    workflows: [
      {
        title: 'Incident lifecycle management',
        description: 'Log, prioritize, resolve, and review tickets with clear ownership and metrics.',
      },
      {
        title: 'Continuous improvement loops',
        description: 'Retros, KPI dashboards, and SOP updates that turn lessons learned into better service.',
      },
      {
        title: 'Certification-backed learning',
        description: 'Structured study plans that align new knowledge with day-to-day support scenarios.',
      },
    ],
  },
  projects: {
    featured: [
      {
        title: 'Support Operations Playbook',
        subtitle: 'Documenting workflows for incident response and knowledge sharing',
        description:
          'Compiled a reusable playbook covering intake, triage, communication, and retrospective steps to help teams respond consistently to application issues.',
        contributions: [
          'Interviewed stakeholders across IT and business functions to capture expectations and common pain points.',
          'Mapped escalation paths and communication templates to maintain SLA visibility.',
          'Built KPI dashboards that track resolution time, reopen rates, and customer feedback.',
        ],
        outcomes: [
          'Improved incident response time by standardizing intake checklists.',
          'Reduced duplicate tickets through better knowledge base surfacing.',
          'Enabled onboarding of new analysts with a single reference guide.',
        ],
        tech: ['Confluence', 'Power BI', 'MS Teams', 'Excel'],
      },
      {
        title: 'Azure Resource Governance Lab',
        subtitle: 'Cloud administration exercises from the Microsoft Azure program',
        description:
          'Implemented governance policies, monitoring, and backup plans in a lab environment to ensure stable deployments.',
        contributions: [
          'Configured role-based access control (RBAC) and resource groups for secure, organized access.',
          'Set up monitoring alerts and dashboards to surface health metrics.',
          'Automated VM provisioning scripts for repeatable lab scenarios.',
        ],
        outcomes: [
          'Established best practices for cost and performance visibility.',
          'Improved recovery readiness through scheduled backup policies.',
          'Documented reproducible steps for future Azure deployments.',
        ],
        tech: ['Microsoft Azure', 'Azure Monitor', 'PowerShell', 'ARM templates'],
      },
      {
        title: 'Cybersecurity Incident Simulation',
        subtitle: 'Cisco Packet Tracer & security internship capstone',
        description:
          'Designed network topologies, implemented security controls, and responded to simulated incidents to strengthen defensive skills.',
        contributions: [
          'Built routing and switching labs with VLAN segmentation and ACLs.',
          'Configured IDS/IPS rules and analyzed incident logs for root causes.',
          'Created post-incident reports with action-oriented recommendations.',
        ],
        outcomes: [
          'Improved mean time to detect issues within simulated environments.',
          'Validated remediation steps through Packet Tracer verification.',
          'Shared learnings with peers to raise overall lab performance.',
        ],
        tech: ['Cisco Packet Tracer', 'Networking protocols', 'Security policies'],
      },
    ],
    labs: [
      {
        title: 'Data Visualization Journeys',
        description: 'Power BI dashboards built during the TCS internship to track KPI trends.',
        linkLabel: 'Request a walkthrough',
        linkHref: '#contact',
      },
      {
        title: 'Trailhead Automation Demos',
        description: 'Salesforce admin flows showcasing automation and stakeholder alerts.',
        linkLabel: 'Connect for a demo',
        linkHref: '#contact',
      },
    ],
    process: [
      {
        title: 'Discover',
        description: 'Understand business context, collect requirements, and document SLAs before acting.',
      },
      {
        title: 'Diagnose',
        description: 'Reproduce issues, analyze logs, and collaborate with engineering for targeted fixes.',
      },
      {
        title: 'Deliver',
        description: 'Deploy changes, validate outcomes, and capture knowledge for future teams.',
      },
    ],
  },
  contact: {
    email: 'naseer3504581@gmail.com',
    location: 'Guntur, Andhra Pradesh (Remote-ready)',
    availability: 'Actively pursuing full-time software/application support roles.',
    services: [
      {
        title: 'Application support & ticket management',
        description: 'Handle incident intake, resolution, and stakeholder communication with clear documentation.',
      },
      {
        title: 'Knowledge base & process optimization',
        description: 'Structure SOPs, playbooks, and dashboards that keep teams aligned on SLAs.',
      },
      {
        title: 'Cloud & tooling assistance',
        description: 'Support deployments and automation across Azure, AWS EC2, and Salesforce environments.',
      },
    ],
    testimonials: [
      {
        quote: 'Naseeruddin quickly earned the trust of our support team by closing lab challenges early and coaching peers through troubleshooting steps.',
        author: 'Program Mentor',
        role: 'Cisco Cybersecurity Virtual Internship',
      },
      {
        quote: 'He keeps stakeholders updated with clear summaries and metrics, which helped our project track performance improvements.',
        author: 'Project Supervisor',
        role: 'Freelance support engagement',
      },
    ],
    socials: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/naseeruddin-shaik' },
      { label: 'Email', href: 'mailto:naseer3504581@gmail.com' },
      { label: 'Phone', href: 'tel:+918143214862' },
    ],
    schedule: [
      { label: 'Discovery call', slots: '30-minute intro sessions available this week' },
      { label: 'Process review', slots: 'Book a deep-dive on support workflows within two weeks' },
      { label: 'Onboarding support', slots: 'Ready to start with two weeks notice' },
    ],
  },
};
