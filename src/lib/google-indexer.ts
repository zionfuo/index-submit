import { JWT } from 'google-auth-library';

const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

export interface GoogleIndexerOptions {
  credentialsJson: string;
}

export class GoogleIndexer {
  private credentialsJson: string;

  constructor(options: GoogleIndexerOptions) {
    this.credentialsJson = options.credentialsJson;
  }

  private async getAccessToken(): Promise<string> {
    // Write JSON to temp file for google-auth-library
    const tempDir = await import('node:fs').then(fs => fs.promises.mkdtemp('/tmp/google-creds-'));
    const credFile = `${tempDir}/credentials.json`;
    await import('node:fs').then(fs => fs.promises.writeFile(credFile, this.credentialsJson));

    const client = new JWT({
      email: undefined,
      keyFile: credFile,
      scopes: SCOPES,
    });

    const token = await client.getAccessToken();
    if (!token) throw new Error('Failed to get Google access token');

    // Cleanup temp file
    await import('node:fs').then(fs => fs.promises.unlink(credFile).catch(() => {}));
    await import('node:fs').then(fs => fs.promises.rmdir(tempDir).catch(() => {}));

    return token;
  }

  public async submitUrl(url: string): Promise<{ success: boolean; error?: string }> {
    return this.submitUrls([url]).then(r => r[0]);
  }

  public async submitUrls(urls: string[]): Promise<Array<{ success: boolean; url: string; error?: string }>> {
    const accessToken = await this.getAccessToken();

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const response = await fetch(INDEXING_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            type: 'URL_UPDATED',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Google API error: ${response.status} ${errorText}`);
        }

        return { success: true, url };
      })
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return { success: false, url: urls[i], error: result.reason?.message || 'Unknown error' };
    });
  }
}