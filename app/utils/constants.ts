import { LLMManager } from '~/lib/modules/llm/manager';
import type { Template } from '~/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bit_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Expo App',
    label: 'Expo App',
    description: 'Expo starter template for building cross-platform mobile apps',
    githubRepo: 'xKevIsDev/bit-expo-template',
    tags: ['mobile', 'expo', 'mobile-app', 'android', 'iphone'],
    icon: 'i-bit:expo',
  },
  {
    name: 'Basic Astro',
    label: 'Astro Basic',
    description: 'Lightweight Astro starter template for building fast static websites',
    githubRepo: 'xKevIsDev/bit-astro-basic-template',
    tags: ['astro', 'blog', 'performance'],
    icon: 'i-bit:astro',
  },
  {
    name: 'NextJS Shadcn',
    label: 'Next.js with shadcn/ui',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'xKevIsDev/bit-nextjs-shadcn-template',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-bit:nextjs',
  },
  {
    name: 'Vite Shadcn',
    label: 'Vite with shadcn/ui',
    description: 'Vite starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'xKevIsDev/vite-shadcn',
    tags: ['vite', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-bit:shadcn',
  },
  {
    name: 'Qwik Typescript',
    label: 'Qwik TypeScript',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    githubRepo: 'xKevIsDev/bit-qwik-ts-template',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-bit:qwik',
  },
  {
    name: 'Remix Typescript',
    label: 'Remix TypeScript',
    description: 'Remix framework starter with TypeScript for full-stack web applications',
    githubRepo: 'xKevIsDev/bit-remix-ts-template',
    tags: ['remix', 'typescript', 'fullstack', 'react'],
    icon: 'i-bit:remix',
  },
  {
    name: 'Slidev',
    label: 'Slidev Presentation',
    description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
    githubRepo: 'xKevIsDev/bit-slidev-template',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: 'i-bit:slidev',
  },
  {
    name: 'Sveltekit',
    label: 'SvelteKit',
    description: 'SvelteKit starter template for building fast, efficient web applications',
    githubRepo: 'bit-sveltekit-template',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: 'i-bit:svelte',
  },
  {
    name: 'Vanilla Vite',
    label: 'Vanilla + Vite',
    description: 'Minimal Vite starter template for vanilla JavaScript projects',
    githubRepo: 'xKevIsDev/vanilla-vite-template',
    tags: ['vite', 'vanilla-js', 'minimal'],
    icon: 'i-bit:vite',
  },
  {
    name: 'Vite React',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'xKevIsDev/bit-vite-react-ts-template',
    tags: ['react', 'vite', 'frontend', 'website', 'app'],
    icon: 'i-bit:react',
  },
  {
    name: 'Vite Typescript',
    label: 'Vite + TypeScript',
    description: 'Vite starter template with TypeScript configuration for type-safe development',
    githubRepo: 'xKevIsDev/bit-vite-ts-template',
    tags: ['vite', 'typescript', 'minimal'],
    icon: 'i-bit:typescript',
  },
  {
    name: 'Vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    githubRepo: 'xKevIsDev/bit-vue-template',
    tags: ['vue', 'typescript', 'frontend'],
    icon: 'i-bit:vue',
  },
  {
    name: 'Angular',
    label: 'Angular Starter',
    description: 'A modern Angular starter template with TypeScript support and best practices configuration',
    githubRepo: 'xKevIsDev/bit-angular-template',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-bit:angular',
  },
];
