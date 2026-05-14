import { XMLParser } from 'fast-xml-parser';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl, {
    headers: {
      'User-Agent': 'Astro-SEO-Submitter/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const result = parser.parse(xml);

  // Handle sitemap index (multiple sitemaps)
  if (result.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(result.sitemapindex.sitemap)
      ? result.sitemapindex.sitemap
      : [result.sitemapindex.sitemap];

    const urls: string[] = [];
    for (const sitemap of sitemaps) {
      if (sitemap.loc) {
        const subUrls = await fetchSitemapUrls(sitemap.loc);
        urls.push(...subUrls);
      }
    }
    return urls;
  }

  // Handle URL set (single sitemap with URLs)
  if (result.urlset?.url) {
    const urls = Array.isArray(result.urlset.url)
      ? result.urlset.url
      : [result.urlset.url];
    return urls.map((u: SitemapUrl) => u.loc);
  }

  return [];
}