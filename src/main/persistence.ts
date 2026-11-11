import { app } from 'electron';
import { promises as fs, mkdirSync, writeFileSync, renameSync } from 'fs';
import { dirname, join } from 'path';
import type { PersistedData, AppSettings, PageState } from '../renderer/shared/types';
import { DEFAULT_SETTINGS } from '../renderer/shared/constants';

export class PersistenceManager {
  private get filePath(): string {
    return join(app.getPath('userData'), 'pages.json');
  }

  private get tempPath(): string {
    return `${this.filePath}.tmp`;
  }

  async save(pages: PageState[], settings: AppSettings): Promise<void> {
    const data: PersistedData = {
      pages,
      settings,
      savedAt: Date.now(),
    };
    const json = JSON.stringify(data, null, 2);
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.tempPath, json, 'utf-8');
    await fs.rename(this.tempPath, this.filePath);
  }

  saveSync(pages: PageState[], settings: AppSettings): void {
    const data: PersistedData = { pages, settings, savedAt: Date.now() };
    const json = JSON.stringify(data, null, 2);
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      writeFileSync(this.tempPath, json, 'utf-8');
      renameSync(this.tempPath, this.filePath);
    } catch (err) {
      console.error('[persistence] sync save failed', err);
    }
  }

  async load(): Promise<PersistedData | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedData;
      if (!Array.isArray(parsed.pages)) return null;
      parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) };
      return parsed;
    } catch {
      return null;
    }
  }
}
