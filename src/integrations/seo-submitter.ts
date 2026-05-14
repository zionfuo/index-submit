import type { AstroIntegration } from 'astro';
import { submitToSearchEngines } from './src/lib/seo-submitter';

interface SeoSubmitterIntegrationOptions {
  googleCredentialsJson?: string;
  indexNowApiKey?: string;
  indexNowHost?: string;
  sitemapUrl?: string;
  dryRun?: boolean;
}

function createSeoSubmitterIntegration(options: SeoSubmitterIntegrationOptions = {}): AstroIntegration {
  return {
    name: 'seo-submitter',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const googleCredentialsJson = options.googleCredentialsJson || process.env.GOOGLE_CREDENTIALS_JSON;
        const indexNowApiKey = options.indexNowApiKey || process.env.INDEXNOW_API_KEY;
        const indexNowHost = options.indexNowHost || process.env.INDEXNOW_HOST;
        const sitemapUrl = options.sitemapUrl || process.env.SITEMAP_URL;
        const dryRun = options.dryRun !== undefined ? options.dryRun : process.env.DRY_RUN === 'true';

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
  };
}

export default createSeoSubmitterIntegration;