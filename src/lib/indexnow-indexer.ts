const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

export interface IndexNowIndexerOptions {
  apiKey: string;
  host: string;
}

export class IndexNowIndexer {
  private apiKey: string;
  private host: string;

  constructor(options: IndexNowIndexerOptions) {
    this.apiKey = options.apiKey;
    this.host = options.host;
  }

  private getKeyLocation(): string {
    return `https://${this.host}/${this.apiKey}.txt`;
  }

  public async submitUrl(url: string): Promise<{ success: boolean; error?: string }> {
    return this.submitUrls([url]).then(r => r[0]);
  }

  public async submitUrls(urls: string[]): Promise<Array<{ success: boolean; url: string; error?: string }>> {
    const body = JSON.stringify({
      host: this.host,
      key: this.apiKey,
      keyLocation: this.getKeyLocation(),
      urlList: urls,
    });

    let lastError: string | undefined;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(INDEXNOW_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });

        // 200 OK or 202 Accepted are both successes
        if (response.ok) {
          return urls.map(url => ({ success: true, url }));
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Network error';
      }

      // Exponential backoff before retry
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // All retries failed
    return urls.map(url => ({ success: false, url, error: lastError }));
  }
}
