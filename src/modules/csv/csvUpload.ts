import multer from 'multer';

const ONE_MB = 1_048_576;

export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ONE_MB,
  },
});
