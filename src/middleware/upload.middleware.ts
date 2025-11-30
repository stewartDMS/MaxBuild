import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { UnsupportedFileTypeError, FileSizeLimitError, AppError } from '../lib/errors';

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Verify uploads directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFilename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📁 Saving uploaded file as:', safeFilename);
    cb(null, safeFilename);
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
  console.log('📎 File filter checking:', { 
    originalname: file.originalname, 
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });
  
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
    console.warn('⚠️ File type rejected:', { mimetype: file.mimetype, originalname: file.originalname });
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
 * Transforms multer errors into AppError format for consistent API responses
 */
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  // If no error, pass through
  if (!err) {
    return next();
  }

  console.error('📤 Multer error occurred:', {
    timestamp: new Date().toISOString(),
    errorType: err.constructor?.name,
    code: err.code,
    message: err.message,
    file: req.file?.originalname,
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSize = getMaxFileSize();
      const error = new FileSizeLimitError(req.file?.size || 0, maxSize);
      return next(error);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      const error = new AppError(
        `Unexpected field name: '${err.field}'. Expected field name: 'tender'`,
        400,
        'UNEXPECTED_FIELD',
        {
          field: err.field,
          expectedField: 'tender',
          suggestion: "Use 'tender' as the field name for the file upload",
        }
      );
      return next(error);
    }
    // Other multer errors - wrap in AppError for consistent response
    const error = new AppError(
      `File upload error: ${err.message}`,
      400,
      'FILE_UPLOAD_ERROR',
      {
        code: err.code,
        field: err.field,
      }
    );
    return next(error);
  }
  
  // If it's already an AppError, pass it through
  if (err instanceof AppError) {
    return next(err);
  }
  
  // For any other errors, pass to next error handler
  next(err);
};

export default upload;
