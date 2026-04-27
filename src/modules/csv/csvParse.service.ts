export function parseCsvBufferToJson(buffer: Buffer): Record<string, string>[] {
  const content = buffer.toString('utf-8');
  const rows = content
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
    const parsed: Record<string, string> = {};

    headers.forEach((header, index) => {
      parsed[header] = values[index] ?? '';
    });

    return parsed;
  });
}
