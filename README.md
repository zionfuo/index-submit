# Astro SEO Index Submitter

Automatically submit URLs from your sitemap.xml to Google Indexing API and Bing IndexNow after Astro build completes, accelerating search engine indexing.

## Features

- Reads sitemap.xml and submits all URLs automatically
- Submits to both Google Indexing API and Bing IndexNow simultaneously
- Generates IndexNow API key file to `public/` directory
- Filters URLs disallowed by robots.txt
- Supports Dry Run mode for testing without actual submission
- Installs as an Astro Integration, following official API conventions

## Installation

```bash
npm install
```

## Configuration

Register the plugin in `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import { createSeoSubmitterIntegration } from './src/integrations/seo-submitter';

export default defineConfig({
  integrations: [
    createSeoSubmitterIntegration(),
  ],
});
```

## Environment Variables

Add these in your Cloudflare Pages (or other CI/CD) environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CREDENTIALS_JSON` | Yes | Google service account JSON string (full JSON, not a file path) |
| `INDEXNOW_API_KEY` | Yes | Bing IndexNow API key |
| `INDEXNOW_HOST` | Yes | Your website domain, e.g. `example.com` |
| `SITEMAP_URL` | No | Sitemap URL, defaults to `{origin}/sitemap.xml` |
| `DRY_RUN` | No | Set to `true` to log only without actual submission (for testing) |
| `GOOGLE_DAILY_LIMIT` | No | Google daily submission limit, defaults to 200 |
| `BING_DAILY_LIMIT` | No | Bing daily submission limit, defaults to 200 |

### Google Service Account Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Indexing API** (`indexing.googleapis.com`)
3. Create a service account, download the JSON key
4. Copy the entire JSON file content into the `GOOGLE_CREDENTIALS_JSON` environment variable

### Bing IndexNow Setup

1. Add your site in [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Get your IndexNow API key (or use the key provided by Bing)
3. Set `INDEXNOW_API_KEY` and `INDEXNOW_HOST`

## Project Structure

```
src/
  lib/
    sitemap-parser.ts      # Parse sitemap XML
    robots-filter.ts       # Filter URLs by robots.txt rules
    google-indexer.ts      # Google Indexing API client
    indexnow-indexer.ts    # Bing IndexNow client
    key-file-generator.ts  # Generate IndexNow key file
    seo-submitter.ts       # Integration orchestration
  integrations/
    seo-submitter.ts       # Astro Integration plugin
astro.config.mjs           # Plugin registration
```

## How It Works

1. `astro build` completes
2. Read sitemap.xml to get all URLs
3. Filter by robots.txt
4. Generate `{INDEXNOW_API_KEY}.txt` to `public/` directory
5. Submit to Google and Bing in parallel
6. Output submission results to logs

## Build Log Example

```
[SEO Submitter] Starting submission...
[SEO Submitter] Sitemap: https://example.com/sitemap.xml
[SEO Submitter] Found 42 URLs in sitemap
[SEO Submitter] Generated IndexNow key file: /dist/your-key.txt
[SEO Submitter] Google: 42 submitted, 0 failed
[SEO Submitter] Bing IndexNow: 42 submitted, 0 failed
[SEO Submitter] Submission complete
```