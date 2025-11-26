import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { UnsupportedFileTypeError, FileSizeLimitError } from '../lib/errors';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Supported file types with their MIME types and extensions
const SUPPORTED_FILE_TYPES = [
  { mimeType: 'application/pdf', extension: '.pdf', name: 'PDF' },
  { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx', name: 'Excel (XLSX)' },
  { mimeType: 'application/vnd.ms-excel', extension: '.xls', name: 'Excel (XLS)' },
  { mimeType: 'text/csv', extension: '.csv', name: 'CSV' },
];

// File filter to accept PDFs, Excel files, and CSV files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = SUPPORTED_FILE_TYPES.map(ft => ft.mimeType);
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Create detailed error with supported types
    const supportedTypes = SUPPORTED_FILE_TYPES.map(ft => `${ft.name} (${ft.extension})`);
    const error = new UnsupportedFileTypeError(
      file.mimetype || 'unknown',
      supportedTypes
    );
    cb(error as any);
  }
};

// Get max file size from environment or use default
const getMaxFileSize = (): number => {
  const size = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
  return isNaN(size) ? 10485760 : size; // 10MB default
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: getMaxFileSize(),
  },
});

/**
 * Custom error handler for multer errors
 */
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSize = getMaxFileSize();
      const error = new FileSizeLimitError(req.file?.size || 0, maxSize);
      return next(error);
    }
    // Other multer errors
    return next(err);
  }
  // Pass to next error handler
  next(err);
};

export default upload;
