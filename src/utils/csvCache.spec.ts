import fs from 'fs';
import { getCachedCsv, invalidateCsvCache } from './csvCache';
import { readCsv } from './csvReader';

jest.mock('./csvReader', () => ({
  readCsv: jest.fn(),
}));

type CsvRow = Record<string, string>;

const mockReadCsv = readCsv as jest.MockedFunction<typeof readCsv>;

describe('csvCache', () => {
  const pathA = '/tmp/a.csv';
  const pathB = '/tmp/b.csv';
  let statSyncSpy: jest.SpyInstance;

  beforeEach(() => {
    invalidateCsvCache();
    jest.clearAllMocks();
    statSyncSpy = jest.spyOn(fs, 'statSync');
  });

  afterEach(() => {
    invalidateCsvCache();
    statSyncSpy.mockRestore();
  });

  it('caches on first read', () => {
    const parsedRows: CsvRow[] = [{ Id: '1', Name: 'Massage room' }];
    statSyncSpy.mockReturnValue({ mtimeMs: 100 } as fs.Stats);
    mockReadCsv.mockReturnValueOnce(parsedRows as never);

    const result = getCachedCsv<CsvRow>(pathA);

    expect(mockReadCsv).toHaveBeenCalledTimes(1);
    expect(mockReadCsv).toHaveBeenCalledWith(pathA);
    expect(result).toEqual(parsedRows);
  });

  it('returns cached data when mtime is unchanged', () => {
    const parsedRows: CsvRow[] = [{ Id: '1', Name: 'Massage room' }];
    statSyncSpy.mockReturnValue({ mtimeMs: 100 } as fs.Stats);
    mockReadCsv.mockReturnValueOnce(parsedRows as never);

    const first = getCachedCsv<CsvRow>(pathA);
    const second = getCachedCsv<CsvRow>(pathA);

    expect(mockReadCsv).toHaveBeenCalledTimes(1);
    expect(first).toEqual(parsedRows);
    expect(second).toEqual(parsedRows);
  });

  it('revalidates when revalidate=true', () => {
    const cachedRows: CsvRow[] = [{ Id: '1', Name: 'Massage room' }];
    const updatedRows: CsvRow[] = [{ Id: '2', Name: 'Gym' }];
    statSyncSpy.mockReturnValue({ mtimeMs: 100 } as fs.Stats);
    mockReadCsv.mockReturnValueOnce(cachedRows as never).mockReturnValueOnce(updatedRows as never);

    getCachedCsv<CsvRow>(pathA);
    const result = getCachedCsv<CsvRow>(pathA, { revalidate: true });

    expect(mockReadCsv).toHaveBeenCalledTimes(2);
    expect(result).toEqual(updatedRows);
  });

  it('revalidates when source mtime changes', () => {
    const cachedRows: CsvRow[] = [{ Id: '1', Name: 'Massage room' }];
    const updatedRows: CsvRow[] = [{ Id: '2', Name: 'Gym' }];
    statSyncSpy
      .mockReturnValueOnce({ mtimeMs: 100 } as fs.Stats)
      .mockReturnValueOnce({ mtimeMs: 200 } as fs.Stats);
    mockReadCsv.mockReturnValueOnce(cachedRows as never).mockReturnValueOnce(updatedRows as never);

    getCachedCsv<CsvRow>(pathA);
    const result = getCachedCsv<CsvRow>(pathA);

    expect(mockReadCsv).toHaveBeenCalledTimes(2);
    expect(result).toEqual(updatedRows);
  });

  it('invalidateCsvCache(filePath) clears only one key', () => {
    const rowsA1: CsvRow[] = [{ Id: '1' }];
    const rowsA2: CsvRow[] = [{ Id: '11' }];
    const rowsB: CsvRow[] = [{ Id: '2' }];

    statSyncSpy.mockReturnValue({ mtimeMs: 100 } as fs.Stats);
    mockReadCsv
      .mockReturnValueOnce(rowsA1 as never)
      .mockReturnValueOnce(rowsB as never)
      .mockReturnValueOnce(rowsA2 as never);

    getCachedCsv<CsvRow>(pathA);
    getCachedCsv<CsvRow>(pathB);

    invalidateCsvCache(pathA);

    const nextA = getCachedCsv<CsvRow>(pathA);
    const nextB = getCachedCsv<CsvRow>(pathB);

    expect(mockReadCsv).toHaveBeenCalledTimes(3);
    expect(nextA).toEqual(rowsA2);
    expect(nextB).toEqual(rowsB);
  });

  it('invalidateCsvCache() clears all cache entries', () => {
    const rowsA1: CsvRow[] = [{ Id: '1' }];
    const rowsB1: CsvRow[] = [{ Id: '2' }];
    const rowsA2: CsvRow[] = [{ Id: '3' }];
    const rowsB2: CsvRow[] = [{ Id: '4' }];

    statSyncSpy.mockReturnValue({ mtimeMs: 100 } as fs.Stats);
    mockReadCsv
      .mockReturnValueOnce(rowsA1 as never)
      .mockReturnValueOnce(rowsB1 as never)
      .mockReturnValueOnce(rowsA2 as never)
      .mockReturnValueOnce(rowsB2 as never);

    getCachedCsv<CsvRow>(pathA);
    getCachedCsv<CsvRow>(pathB);

    invalidateCsvCache();

    const nextA = getCachedCsv<CsvRow>(pathA);
    const nextB = getCachedCsv<CsvRow>(pathB);

    expect(mockReadCsv).toHaveBeenCalledTimes(4);
    expect(nextA).toEqual(rowsA2);
    expect(nextB).toEqual(rowsB2);
  });
});
