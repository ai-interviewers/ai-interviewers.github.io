// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// Org root site, so no `base` path prefix is needed.
export default defineConfig({
  site: 'https://ai-interviewers.github.io',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});