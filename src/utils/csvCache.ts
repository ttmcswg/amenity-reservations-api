import fs from 'fs';
import { readCsv } from './csvReader';

interface CsvCacheEntry {
  parsedData: unknown[];
  lastLoadedAt: number;
  sourceMtimeMs: number;
}

const csvCacheStore = new Map<string, CsvCacheEntry>();

export function getCachedCsv<T>(filePath: string, options?: { revalidate?: boolean }): T[] {
  const revalidate = options?.revalidate ?? false;
  const sourceMtimeMs = fs.statSync(filePath).mtimeMs;
  const cached = csvCacheStore.get(filePath);

  if (!cached) {
    const parsedData = readCsv<T>(filePath);
    csvCacheStore.set(filePath, {
      parsedData,
      lastLoadedAt: Date.now(),
      sourceMtimeMs,
    });
    return parsedData;
  }

  if (revalidate || cached.sourceMtimeMs !== sourceMtimeMs) {
    const parsedData = readCsv<T>(filePath);
    csvCacheStore.set(filePath, {
      parsedData,
      lastLoadedAt: Date.now(),
      sourceMtimeMs,
    });
    return parsedData;
  }

  return cached.parsedData as T[];
}

export function invalidateCsvCache(filePath?: string): void {
  if (filePath) {
    csvCacheStore.delete(filePath);
    return;
  }

  csvCacheStore.clear();
}
