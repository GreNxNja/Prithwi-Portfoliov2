export const ME = {
  name: 'Prithwijit Ghosh',
  handle: 'GreNxNja',
  role: 'Software Developer',
  tagline: 'Building sentient AI so I can enjoy my guitar sessions in peace.',
  location: 'Kolkata, IN',
  email: 'dev.prith@proton.me',
  github: 'https://github.com/GreNxNja',
}

/**
 * Served straight from public/, so the download is a static file hit with no
 * route behind it. Replace the PDF in place and the link needs no change.
 */
export const RESUME = {
  href: '/prithwijit-ghosh-resume.pdf',
  filename: 'Prithwijit-Ghosh-Resume.pdf',
}

/** The strip that runs between movements. Read as one long ticker. */
export const TICKER = [
  'System Architecture',
  'Platform Engineering',
  'AI / ML',
  'Kolkata, IN',
  'Available for work',
  'E A D G B E',
]

export const ABOUT = [
  `Computer science graduate working in system architecture, platform
   engineering and AI/ML. Right now that means building an enterprise ERP that
   real companies run their money and inventory through — the kind of software
   where a rounding error is somebody's afternoon.`,
  `Two halves that keep arguing. One writes Python that stares at satellite
   imagery until cloud motion falls out of it. The other writes TypeScript that
   has to feel right in the hand within 100ms. The AI half keeps promising it
   will automate the rest so the guitar half can get back to work.`,
  `Somewhere between the two is the actual interest: system design as
   storytelling. A codebase is an argument about what you thought mattered. So
   is a setlist.`,
]

export const FACTS: Array<[string, string]> = [
  ['Based', 'Kolkata, West Bengal'],
  ['Now', 'Software Developer, Rajwada Infotech'],
  ['Degree', 'B.Tech CS (AI/ML) — 8.17 CGPA'],
  ['Handle', '@GreNxNja'],
  ['Tuning', 'E A D G B E'],
]

export const AWARDS: Array<{
  title: string
  what: string
  when: string
  /** Where it was announced, if there's something public to point at. */
  href?: string
}> = [
  {
    title: 'AI Unite Hackathon — Winner',
    what: 'Epiphany, AI academic platform',
    when: 'Jun 2024',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7216804060543295488/',
  },
  {
    title: 'Smart India Hackathon — Runner-Up',
    what: 'Myrtle, image recognition system',
    when: 'Oct 2023',
  },
]

export type Track = {
  no: string
  title: string
  /** Omitted where the source isn't public. */
  repo?: string
  when: string
  award?: string
  /** The announcement behind the badge, shown in the expanded panel. */
  awardHref?: string
  blurb: string
  detail: string
  stack: Array<string>
  /** Which string this track is tuned to — index into TUNING. */
  string: number
}

export const SETLIST: Array<Track> = [
  {
    no: '01',
    title: 'InkVisage',
    when: 'Jul 2026',
    blurb: 'An AI tattoo platform you can try on before you commit',
    detail: `AR body preview, style-based design generation, and artist and
      gallery discovery driven by Meilisearch. Underneath it's a multi-role
      marketplace — artists, shops and clients each see a different product —
      with real-time booking, messaging and notifications tying them together.`,
    stack: [
      'React',
      'TypeScript',
      'Prisma',
      'SQLite',
      'Socket.io',
      'Meilisearch',
      'Tailwind',
    ],
    string: 0,
  },
  {
    no: '02',
    title: 'GeoVisionAI',
    repo: 'https://github.com/GreNxNja/GeoVisionAI',
    when: 'Dec 2024',
    blurb: 'Video generated from still satellite imagery',
    detail: `Satellites photograph the earth on a schedule. This invents the
      moments in between: an encoder-decoder CNN doing frame interpolation, so a
      sequence of stills becomes smooth, watchable cloud motion.`,
    stack: ['Python', 'PyTorch', 'OpenLayers', 'WMS'],
    string: 1,
  },
  {
    no: '03',
    title: 'NextRead',
    repo: 'https://github.com/GreNxNja/nextRead-beta',
    when: 'Sep 2024',
    blurb: 'A book recommender that reads your reading',
    detail: `Recommendations built from a reader's own preferences rather than
      what's selling, with a dashboard that visualises the reading journey as it
      happens.`,
    stack: ['TanStack', 'Supabase', 'Google Books API', 'Tailwind'],
    string: 3,
  },
  {
    no: '04',
    title: 'Epiphany',
    when: 'Jun 2024',
    award: 'AI Unite Hackathon Winner',
    awardHref:
      'https://www.linkedin.com/feed/update/urn:li:activity:7216804060543295488/',
    blurb: 'An AI learning platform that plans the route for you',
    detail: `Study-path optimisation over what a student actually knows, plus an
      NLP chatbot built on Transformers to answer in context. Architected to hold
      100+ concurrent users without the session falling over.`,
    stack: ['Next.js', 'Convex', 'Clerk', 'Transformers'],
    string: 5,
  },
]

export type Role = {
  company: string
  title: string
  when: string
  where: string
  current?: boolean
  points: Array<string>
  stack: Array<string>
}

export const TOUR: Array<Role> = [
  {
    company: 'Rajwada Infotech',
    title: 'Software Developer',
    when: 'Mar 2026 — Present',
    where: 'Kolkata, WB',
    current: true,
    points: [
      `Led full-stack development of a large-scale ERP platform for the
       construction and civil engineering sector.`,
      `Architected the core financial and inventory modules — transaction
       processing, reconciliation and stock tracking across multiple business
       units.`,
      `Implemented role-based access control and configurable approval
       workflows, now running in production across live enterprise operations.`,
    ],
    stack: ['React', 'TypeScript', 'Node.js', 'SQL Server'],
  },
  {
    company: 'ShahparPay Solutions',
    title: 'Full Stack Developer',
    when: 'Mar 2026 — May 2026',
    where: 'Kolkata, WB',
    points: [
      `Built a platform for digital payments and distributor operations,
       improving transaction processing efficiency.`,
      `Shipped an admin dashboard with authentication, activity tracking and
       reporting, giving stakeholders operational visibility they didn't have.`,
      `Designed the core database architecture and business logic, integrating
       external financial service APIs for end-to-end payment workflows.`,
    ],
    stack: ['PHP', 'MySQL', 'REST APIs'],
  },
]

export type Pedal = { name: string; note: string; hot?: boolean }

export const RIG: Array<{ row: string; pedals: Array<Pedal> }> = [
  {
    row: 'Input',
    pedals: [
      { name: 'TypeScript', note: 'daily driver', hot: true },
      { name: 'Python', note: 'when it has to think', hot: true },
      { name: 'Java', note: 'and the JVM' },
      { name: 'C++', note: 'close to the metal' },
      { name: 'SQL', note: 'the honest one' },
    ],
  },
  {
    row: 'Drive',
    pedals: [
      { name: 'React', note: 'v19', hot: true },
      { name: 'Next.js', note: 'app router' },
      { name: 'Node.js', note: 'the server half' },
      { name: 'Hono', note: 'small and fast' },
      { name: 'Bun', note: 'faster still' },
      { name: 'TanStack', note: 'router / start' },
    ],
  },
  {
    row: 'Tone',
    pedals: [
      { name: 'PostgreSQL', note: 'default answer', hot: true },
      { name: 'SQL Server', note: 'enterprise duty' },
      { name: 'Supabase', note: 'batteries included' },
      { name: 'Prisma', note: 'typed access' },
      { name: 'Socket.io', note: 'real-time' },
      { name: 'Tailwind', note: 'v4' },
    ],
  },
  {
    row: 'Rack',
    pedals: [
      { name: 'PyTorch', note: 'CNNs, interpolation', hot: true },
      { name: 'Transformers', note: 'NLP' },
      { name: 'AWS', note: 'EC2, IAM' },
      { name: 'Docker', note: 'ships it' },
      { name: 'n8n', note: 'automation' },
      { name: 'OAuth', note: 'who goes there' },
    ],
  },
]

/* Kept in step with the résumé PDF — same list, same order, same issuers. */
export const CERTS = [
  'Anthropic — Model Context Protocol (2026)',
  'Coursera (IBM) — Data Science Professional (2025)',
  'Udemy — Master in Artificial Intelligence (2025)',
  'Stanford — Machine Learning (2024)',
  'IIT Bombay — e-Yantra Robotics with VLSI (2023)',
]

export type Signal = {
  label: string
  where: string
  href: string
  band: string
}

export const SIGNALS: Array<Signal> = [
  {
    label: 'GitHub',
    where: '@GreNxNja',
    href: 'https://github.com/GreNxNja',
    band: 'AM',
  },
  {
    label: 'LinkedIn',
    where: '/in/greninja',
    href: 'https://linkedin.com/in/greninja',
    band: 'SW',
  },
  {
    label: 'Writing',
    where: 'prithwiblogs.vercel.app',
    href: 'https://prithwiblogs.vercel.app',
    band: 'LW',
  },
]
