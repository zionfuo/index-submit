import { GoogleIndexer } from './google-indexer';
import { IndexNowIndexer } from './indexnow-indexer';
import { fetchSitemapUrls } from './sitemap-parser';
import { fetchRobotsRules, filterUrlsByRobots } from './robots-filter';
import { KeyFileGenerator } from './key-file-generator';

export interface SeoSubmitterOptions {
  googleCredentialsJson: string;
  indexNowApiKey: string;
  indexNowHost: string;
  sitemapUrl?: string;
  publicDir: string;
  dryRun?: boolean;
  googleDailyLimit?: number;
  bingDailyLimit?: number;
}

const DEFAULT_GOOGLE_DAILY_LIMIT = 200;
const DEFAULT_BING_DAILY_LIMIT = 200;

export async function submitToSearchEngines(options: SeoSubmitterOptions): Promise<void> {
  const {
    googleCredentialsJson,
    indexNowApiKey,
    indexNowHost,
    sitemapUrl,
    publicDir,
    dryRun = false,
    googleDailyLimit = DEFAULT_GOOGLE_DAILY_LIMIT,
    bingDailyLimit = DEFAULT_BING_DAILY_LIMIT,
  } = options;

  const origin = new URL(sitemapUrl || `https://${indexNowHost}/sitemap.xml`).origin;
  const finalSitemapUrl = sitemapUrl || `${origin}/sitemap.xml`;
  const robotsUrl = `${origin}/robots.txt`;

  console.log(`[SEO Submitter] Starting submission...`);
  console.log(`[SEO Submitter] Sitemap: ${finalSitemapUrl}`);

  // 1. Fetch and parse sitemap
  let urls: string[];
  try {
    urls = await fetchSitemapUrls(finalSitemapUrl);
    console.log(`[SEO Submitter] Found ${urls.length} URLs in sitemap`);
  } catch (err) {
    console.error(`[SEO Submitter] Failed to fetch sitemap: ${err}`);
    return;
  }

  if (urls.length === 0) {
    console.log(`[SEO Submitter] No URLs found in sitemap, skipping`);
    return;
  }

  // 2. Filter by robots.txt
  const robotsRules = await fetchRobotsRules(robotsUrl);
  const allowedUrls = filterUrlsByRobots(urls, robotsRules);
  const filteredCount = urls.length - allowedUrls.length;
  if (filteredCount > 0) {
    console.log(`[SEO Submitter] Filtered out ${filteredCount} URLs disallowed by robots.txt`);
  }

  if (dryRun) {
    console.log(`[SEO Submitter] DRY RUN: Would submit ${allowedUrls.length} URLs`);
    console.log(`[SEO Submitter] First 5 URLs:`, allowedUrls.slice(0, 5));
    return;
  }

  // 3. Generate IndexNow key file
  try {
    const keyGen = new KeyFileGenerator({ outputDir: publicDir });
    const keyFilePath = await keyGen.generateKeyFile(indexNowApiKey);
    console.log(`[SEO Submitter] Generated IndexNow key file: ${keyFilePath}`);
  } catch (err) {
    console.error(`[SEO Submitter] Failed to generate key file: ${err}`);
  }

  // 4. Submit to Google and Bing in parallel
  const googleUrls = allowedUrls.slice(0, googleDailyLimit);
  const bingUrls = allowedUrls.slice(0, bingDailyLimit);

  if (googleUrls.length < allowedUrls.length) {
    console.log(`[SEO Submitter] Google: limiting to ${googleDailyLimit} URLs (total: ${allowedUrls.length})`);
  }
  if (bingUrls.length < allowedUrls.length) {
    console.log(`[SEO Submitter] Bing: limiting to ${bingDailyLimit} URLs (total: ${allowedUrls.length})`);
  }

  const results = await Promise.allSettled([
    (async () => {
      const indexer = new GoogleIndexer({ credentialsJson: googleCredentialsJson });
      return await indexer.submitUrls(googleUrls);
    })(),
    (async () => {
      const indexer = new IndexNowIndexer({ apiKey: indexNowApiKey, host: indexNowHost });
      return await indexer.submitUrls(bingUrls);
    })(),
  ]);

  // 5. Report results
  const [googleResults, bingResults] = results;

  if (googleResults.status === 'fulfilled') {
    const googleSuccess = googleResults.value.filter(r => r.success).length;
    const googleFailed = googleResults.value.filter(r => !r.success).length;
    console.log(`[SEO Submitter] Google: ${googleSuccess} submitted, ${googleFailed} failed`);
    if (googleFailed > 0) {
      googleResults.value
        .filter(r => !r.success)
        .forEach(r => console.error(`[SEO Submitter] Google failed: ${r.url} — ${r.error}`));
    }
  } else {
    console.error(`[SEO Submitter] Google submission entirely failed: ${googleResults.reason}`);
  }

  if (bingResults.status === 'fulfilled') {
    const bingSuccess = bingResults.value.filter(r => r.success).length;
    const bingFailed = bingResults.value.filter(r => !r.success).length;
    console.log(`[SEO Submitter] Bing IndexNow: ${bingSuccess} submitted, ${bingFailed} failed`);
    if (bingFailed > 0) {
      bingResults.value
        .filter(r => !r.success)
        .forEach(r => console.error(`[SEO Submitter] Bing failed: ${r.url} — ${r.error}`));
    }
  } else {
    console.error(`[SEO Submitter] Bing submission entirely failed: ${bingResults.reason}`);
  }

  console.log(`[SEO Submitter] Submission complete`);
}