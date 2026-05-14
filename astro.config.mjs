import { defineConfig } from 'astro/config';
import { submitToSearchEngines } from './src/lib/seo-submitter';

export default defineConfig({
  output: 'static',
  integrations: [],
  hooks: {
    'astro:build:done': async ({ dir, pages }) => {
      const googleCredentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
      const indexNowApiKey = process.env.INDEXNOW_API_KEY;
      const indexNowHost = process.env.INDEXNOW_HOST;
      const sitemapUrl = process.env.SITEMAP_URL;
      const dryRun = process.env.DRY_RUN === 'true';

      if (!googleCredentialsJson || !indexNowApiKey || !indexNowHost) {
        console.log('[SEO Submitter] Missing required environment variables, skipping');
        return;
      }

      await submitToSearchEngines({
        googleCredentialsJson,
        indexNowApiKey,
        indexNowHost,
        sitemapUrl,
        publicDir: dir.pathname,
        dryRun,
      });
    },
  },
});