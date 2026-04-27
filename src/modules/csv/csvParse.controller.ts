import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateCsvFileMeta } from './csvParse.schema';
import { parseCsvBufferToJson } from './csvParse.service';

export function parseCsvFile(req: Request, res: Response): void {
  const file = req.file;

  if (!file) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'File is required. Use multipart/form-data with field name "file".',
    });
    return;
  }

  const fileValidation = validateCsvFileMeta(file);
  if (!fileValidation.valid) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: fileValidation.message ?? 'Invalid file.',
    });
    return;
  }

  const parsedRows = parseCsvBufferToJson(file.buffer);
  res.status(StatusCodes.OK).json(parsedRows);
}
