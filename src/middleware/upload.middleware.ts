import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { UnsupportedFileTypeError, FileSizeLimitError, AppError } from '../lib/errors';

// Check if running in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Get request ID for logging traceability
 */
function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

/**
 * Get sanitized file info for logging (excludes potentially sensitive original filename)
 */
function getSafeFileInfo(file: Express.Multer.File): Record<string, unknown> {
  return {
    mimetype: file.mimetype,
    fieldname: file.fieldname,
    extension: path.extname(file.originalname).toLowerCase(),
  };
}

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

/**
 * Sanitize file extension to prevent path traversal and other attacks
 * Only allows alphanumeric extensions up to 10 characters
 */
function sanitizeExtension(originalname: string): string {
  const ext = path.extname(originalname).toLowerCase();
  // Only allow safe extensions (alphanumeric, starting with a dot, max 10 chars)
  if (/^\.[a-z0-9]{1,10}$/i.test(ext)) {
    return ext;
  }
  // Default to empty extension if invalid
  return '';
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const requestId = getRequestId(req);
    console.log(`[${requestId}] 📂 Storage destination callback triggered`, {
      timestamp: new Date().toISOString(),
      ...getSafeFileInfo(file),
    });
    // Verify uploads directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      console.log(`[${requestId}] 📁 Creating uploads directory...`);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    console.log(`[${requestId}] ✅ Destination set to: ${uploadsDir}`);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const requestId = getRequestId(req);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Sanitize the extension to prevent path traversal attacks
    const safeExtension = sanitizeExtension(file.originalname);
    const safeFilename = file.fieldname + '-' + uniqueSuffix + safeExtension;
    console.log(`[${requestId}] 📁 Saving uploaded file as:`, {
      safeFilename,
      extension: safeExtension,
      timestamp: new Date().toISOString(),
    });
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
  const requestId = getRequestId(req);
  console.log(`[${requestId}] 📎 File filter checking:`, { 
    timestamp: new Date().toISOString(),
    ...getSafeFileInfo(file),
    size: file.size,
  });
  
  const allowedMimeTypes = SUPPORTED_FILE_TYPES.map(ft => ft.mimeType);
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log(`[${requestId}] ✅ File type accepted: ${file.mimetype}`);
    cb(null, true);
  } else {
    // Create detailed error with supported types
    const supportedTypes = SUPPORTED_FILE_TYPES.map(ft => `${ft.name} (${ft.extension})`);
    const error = new UnsupportedFileTypeError(
      file.mimetype || 'unknown',
      supportedTypes
    );
    console.warn(`[${requestId}] ⚠️ File type rejected:`, { 
      mimetype: file.mimetype, 
      extension: path.extname(file.originalname).toLowerCase(),
      allowedTypes: allowedMimeTypes,
    });
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
  const requestId = getRequestId(req);
  
  // If no error, pass through
  if (!err) {
    console.log(`[${requestId}] ✅ No multer error, passing through handleMulterError`);
    return next();
  }

  // Build error log object - include stack trace only in development
  const errorLogData: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    errorType: err.constructor?.name,
    code: err.code,
    message: err.message,
  };
  
  // Only include stack trace in development for security
  if (isDevelopment && err.stack) {
    errorLogData.stack = err.stack;
  }
  
  console.error(`[${requestId}] 📤 Multer error occurred:`, errorLogData);

  if (err instanceof multer.MulterError) {
    console.log(`[${requestId}] 🔍 Handling MulterError with code: ${err.code}`);
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSize = getMaxFileSize();
      const error = new FileSizeLimitError(req.file?.size || 0, maxSize);
      console.log(`[${requestId}] ❌ File size limit exceeded`);
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
      console.log(`[${requestId}] ❌ Unexpected field name: ${err.field}`);
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
    console.log(`[${requestId}] ❌ Other multer error: ${err.code}`);
    return next(error);
  }
  
  // If it's already an AppError, pass it through
  if (err instanceof AppError) {
    console.log(`[${requestId}] 🔄 Passing through existing AppError: ${err.reason}`);
    return next(err);
  }
  
  // For any other errors, pass to next error handler
  console.log(`[${requestId}] 🔄 Passing unknown error to next handler:`, err.message);
  next(err);
};

/**
 * Mock upload configuration - accepts any file type for demo purposes
 * This is used by the mock endpoint which doesn't require strict file validation
 */
export const mockUpload = multer({
  storage: storage,
  // No file filter - accept any file type for mock/demo purposes
  limits: {
    fileSize: getMaxFileSize(),
  },
});

export default upload;
