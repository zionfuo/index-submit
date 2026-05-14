export interface RobotsRule {
  disallow: string[];
  allow: string[];
}

export async function fetchRobotsRules(robotsUrl: string): Promise<RobotsRule> {
  try {
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Astro-SEO-Submitter/1.0',
      },
    });

    if (!response.ok) {
      return { disallow: [], allow: [] };
    }

    const text = await response.text();
    const lines = text.split('\n');

    const rule: RobotsRule = { disallow: [], allow: [] };
    let userAgent: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) continue;

      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        userAgent = trimmed.split(':')[1].trim();
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        const path = trimmed.split(':')[1].trim();
        if (path) rule.disallow.push(path);
      } else if (trimmed.toLowerCase().startsWith('allow:')) {
        const path = trimmed.split(':')[1].trim();
        if (path) rule.allow.push(path);
      }
    }

    return rule;
  } catch {
    return { disallow: [], allow: [] };
  }
}

export function isUrlAllowed(url: string, robotsRules: RobotsRule): boolean {
  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname;

  for (const allow of robotsRules.allow) {
    if (path.startsWith(allow)) return true;
  }

  for (const disallow of robotsRules.disallow) {
    if (path.startsWith(disallow)) return false;
  }

  return true;
}

export function filterUrlsByRobots(urls: string[], robotsRules: RobotsRule): string[] {
  return urls.filter(url => isUrlAllowed(url, robotsRules));
}