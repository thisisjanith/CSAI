import type { Course } from '../lib/types'

// Fallback copy of the draft module outline (mirrors supabase/schema.sql seed).
// Used for the public site when the database is not reachable yet.
export const fallbackCourses: Course[] = [
  {
    id: 'fallback-1',
    slug: 'professional-skills-with-ai',
    title: 'Professional Skills with AI',
    tagline: 'Work smarter: write, research, analyse and present with AI.',
    description:
      'Become the most productive person in your team. Learn to use modern AI assistants for writing, research, data analysis, presentations and everyday workflows, responsibly and effectively.',
    price_lkr: 25000,
    duration: '8 weeks · live on Zoom',
    level: 'Beginner',
    icon: 'briefcase',
    highlights: ['Prompt engineering that actually works', 'AI for documents, email & reports', 'Data analysis with AI', 'Automating repetitive tasks'],
    outline: [
      { title: 'Foundations', topics: ['How modern AI models work', 'Prompting fundamentals', 'Choosing the right AI tool'] },
      { title: 'Everyday productivity', topics: ['Writing & editing with AI', 'Research and summarising', 'Meetings, notes and email'] },
      { title: 'Data & presentations', topics: ['Spreadsheets and data analysis', 'Building slide decks with AI', 'Visualising insights'] },
      { title: 'Automation & ethics', topics: ['No-code automations', 'Responsible and safe AI use', 'Capstone project'] },
    ],
    is_published: true,
    sort_order: 1,
  },
  {
    id: 'fallback-2',
    slug: 'game-development-with-ai',
    title: 'Game Development with AI',
    tagline: 'Design, build and ship games faster with AI copilots.',
    description:
      'From idea to playable game. Use AI to generate assets, write game logic, design levels and build smarter NPCs while learning core game-development concepts.',
    price_lkr: 35000,
    duration: '10 weeks · live on Zoom',
    level: 'Beginner → Intermediate',
    icon: 'gamepad',
    highlights: ['Game design fundamentals', 'AI-generated art, audio & assets', 'Coding gameplay with AI copilots', 'Publish your own game'],
    outline: [
      { title: 'Game design', topics: ['Core loops and mechanics', 'Prototyping ideas with AI', 'Storytelling and worlds'] },
      { title: 'Building the game', topics: ['Engine basics', 'Writing gameplay code with AI', 'Physics, input and UI'] },
      { title: 'AI-powered content', topics: ['Generating sprites, textures and audio', 'Procedural levels', 'Smarter NPC behaviour'] },
      { title: 'Ship it', topics: ['Testing and polish', 'Publishing to web and mobile', 'Capstone: your own game'] },
    ],
    is_published: true,
    sort_order: 2,
  },
  {
    id: 'fallback-3',
    slug: 'mobile-and-web-app-dev-with-ai',
    title: 'Mobile and Web Application Dev with AI',
    tagline: 'Build real apps for web and mobile with AI pair-programming.',
    description:
      'Learn modern web and mobile development while using AI coding assistants to move fast. Build, deploy and maintain production-ready applications.',
    price_lkr: 40000,
    duration: '12 weeks · live on Zoom',
    level: 'Beginner → Intermediate',
    icon: 'code',
    highlights: ['Modern web fundamentals', 'AI pair-programming workflows', 'APIs, databases & auth', 'Deploying real apps'],
    outline: [
      { title: 'Web foundations', topics: ['HTML, CSS and JavaScript essentials', 'Working with AI coding assistants', 'Git and version control'] },
      { title: 'Front-end apps', topics: ['Component-based UI', 'Responsive, mobile-first design', 'State and data fetching'] },
      { title: 'Back-end & data', topics: ['APIs and databases', 'Authentication', 'Adding AI features to apps'] },
      { title: 'Mobile & deployment', topics: ['Cross-platform mobile apps', 'Testing and debugging with AI', 'Capstone: deploy your app'] },
    ],
    is_published: true,
    sort_order: 3,
  },
  {
    id: 'fallback-4',
    slug: 'digital-marketing-with-ai',
    title: 'Digital Marketing with AI',
    tagline: 'Grow brands with AI-driven content, ads and analytics.',
    description:
      'Plan, create and optimise digital campaigns with AI. Generate content, design creatives, target audiences and measure results across social, search and email.',
    price_lkr: 25000,
    duration: '8 weeks · live on Zoom',
    level: 'Beginner',
    icon: 'megaphone',
    highlights: ['AI content & copywriting', 'Social media creatives', 'Ads, SEO & targeting', 'Analytics and reporting'],
    outline: [
      { title: 'Strategy', topics: ['Digital marketing fundamentals', 'Audience research with AI', 'Brand voice and positioning'] },
      { title: 'Content creation', topics: ['Copywriting with AI', 'Images and short-form video', 'Content calendars'] },
      { title: 'Growth channels', topics: ['Social media marketing', 'SEO in the AI era', 'Paid ads and email'] },
      { title: 'Measure & optimise', topics: ['Analytics dashboards', 'A/B testing with AI', 'Capstone campaign'] },
    ],
    is_published: true,
    sort_order: 4,
  },
]
