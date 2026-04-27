import { z } from 'zod';

const csvFileSchema = z.object({
  mimetype: z.string(),
  originalname: z.string(),
});

export function validateCsvFileMeta(file: Express.Multer.File): { valid: boolean; message?: string } {
  const parsed = csvFileSchema.safeParse({
    mimetype: file.mimetype,
    originalname: file.originalname,
  });

  if (!parsed.success) {
    return { valid: false, message: 'Invalid uploaded file metadata.' };
  }

  const hasCsvMimeType = parsed.data.mimetype === 'text/csv';
  const hasCsvExtension = parsed.data.originalname.toLowerCase().endsWith('.csv');

  if (!hasCsvMimeType && !hasCsvExtension) {
    return { valid: false, message: 'Invalid file type. Only CSV files are allowed.' };
  }

  return { valid: true };
}
