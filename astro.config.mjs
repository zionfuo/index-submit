import { defineConfig } from 'astro/config';
import { createSeoSubmitterIntegration } from './src/integrations/seo-submitter';

export default defineConfig({
  output: 'static',
  vite: {
    ssr: {
      noExternal: ['googleapis'],
    },
  },
  integrations: [
    createSeoSubmitterIntegration(),
  ],
});