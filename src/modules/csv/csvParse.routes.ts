import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { parseCsvFile } from './csvParse.controller';
import { uploadCsv } from './csvUpload';

const csvParseRouter = Router();

csvParseRouter.post('/csv/parse', uploadCsv.single('file'), parseCsvFile);

csvParseRouter.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'File is too large. Maximum allowed size is 1MB.' });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(400).json({ message: 'Invalid file upload request.' });
});

export default csvParseRouter;
