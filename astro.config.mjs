// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// Org root site, so no `base` path prefix is needed.
export default defineConfig({
  site: 'https://ai-interviewers.github.io',
  integrations: [sitemap()],
  // The dev toolbar sits bottom-centre and intercepts clicks on the Phase 2 mockups'
  // palette switcher. Off while comparing directions.
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()]
  }
});