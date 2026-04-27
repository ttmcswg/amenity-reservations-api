import fs from 'fs';

export function readCsv<T>(filePath: string): T[] {
  const rawFile = fs.readFileSync(filePath, 'utf-8');
  const rows = rawFile
    .split('\n')
    .map((row) => row.trim())
    .filter((row) => row.length > 0);

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].split(',').map((header) => header.trim());
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const values = row.split(',').map((value) => value.trim());
    const entry: Record<string, string> = {};

    headers.forEach((header, index) => {
      entry[header] = values[index] ?? '';
    });

    return entry as T;
  });
}
