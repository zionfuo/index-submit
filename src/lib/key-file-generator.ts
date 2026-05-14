import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface KeyFileGeneratorOptions {
  outputDir: string;
}

export class KeyFileGenerator {
  private outputDir: string;

  constructor(options: KeyFileGeneratorOptions) {
    this.outputDir = options.outputDir;
  }

  public async generateKeyFile(apiKey: string): Promise<string> {
    await mkdir(this.outputDir, { recursive: true });
    const filePath = join(this.outputDir, `${apiKey}.txt`);
    await writeFile(filePath, apiKey, 'utf-8');
    return filePath;
  }
}
