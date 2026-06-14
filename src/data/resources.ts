import { ResourceItem } from '../types';

export const developerResources: ResourceItem[] = [
  // Free Databases
  {
    id: 'db-supabase',
    name: 'Supabase',
    description: 'An open-source Firebase alternative. Provides a hosted PostgreSQL database, Auth, instant APIs, and Edge Functions on a generous free tier.',
    category: 'database',
    url: 'https://supabase.com'
  },
  {
    id: 'db-neon',
    name: 'Neon DB',
    description: 'Serverless Open-Source PostgreSQL database with instant autoscaling, database branching (like Git branches), and cold-start speed optimal for cloud runtimes.',
    category: 'database',
    url: 'https://neon.tech'
  },
  {
    id: 'db-mongodb',
    name: 'MongoDB Atlas',
    description: 'Fully managed cloud-based NoSQL document database. Free tier includes 512MB shared RAM, perfect for simple JSON collections and standard app states.',
    category: 'database',
    url: 'https://www.mongodb.com/products/platform/atlas-database'
  },
  {
    id: 'db-upstash',
    name: 'Upstash Redis',
    description: 'Serverless Redis and Kafka databases with HTTP/REST APIs. Perfect for rate-limiting, serverless caching, and quick session stores with 10k daily requests free.',
    category: 'database',
    url: 'https://upstash.com'
  },
  // Social Media & Deployment Tools
  {
    id: 'soc-typefully',
    name: 'Typefully',
    description: 'Superb writing environment to draft, schedule, and analyze tweets and LinkedIn posts. Includes thread-split visualizers and active writing prompts.',
    category: 'social',
    url: 'https://typefully.com'
  },
  {
    id: 'soc-buffer',
    name: 'Buffer',
    description: 'All-in-one social media scheduler. Allows scheduling up to 10 future posts for three primary business channels under the free membership.',
    category: 'social',
    url: 'https://buffer.com'
  },
  {
    id: 'soc-linktree',
    name: 'Linktree',
    description: 'A simple, highly customizable "Link-in-bio" launch landing page. Organize all portfolios, repositories, and socials inside a single visual index.',
    category: 'social',
    url: 'https://linktr.ee'
  },
  {
    id: 'soc-canva',
    name: 'Canva',
    description: 'Visual graphics platform containing hundreds of pre-coded template dimensions for social banners, LinkedIn graphics, and web background frames.',
    category: 'social',
    url: 'https://canva.com'
  },
  // AI Platforms
  {
    id: 'ai-aistudio',
    name: 'Google AI Studio',
    description: 'A web-based prototyping environment for developers to experiment with Gemini models. Generates API keys, system instructions, and code blocks.',
    category: 'ai',
    url: 'https://aistudio.google.com'
  },
  {
    id: 'ai-bolt',
    name: 'Bolt.new',
    description: 'An AI-powered development sandbox that runs entire full-stack projects directly in the browser—spanning Vite, Node, and live preview servers.',
    category: 'ai',
    url: 'https://bolt.new'
  },
  {
    id: 'ai-lovable',
    name: 'Lovable.dev',
    description: 'Full-stack AI developer assistant that converts natural language input into production-ready React client codebases, complete with database bindings.',
    category: 'ai',
    url: 'https://lovable.dev'
  },
  {
    id: 'ai-v0',
    name: 'v0 by Vercel',
    description: 'Generative UI interface that builds state-of-the-art styled components using React, Tailwind Utility classes, and Shadcn templates on prompt command.',
    category: 'ai',
    url: 'https://v0.dev'
  }
];
