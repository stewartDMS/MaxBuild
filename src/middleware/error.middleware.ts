import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

/**
 * Global error handling middleware with structured error responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine if this is our custom AppError
  const isAppError = err instanceof AppError;
  
  // Extract error details
  const statusCode = isAppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const reason = isAppError ? err.reason : 'INTERNAL_SERVER_ERROR';
  const details = isAppError ? err.details : undefined;

  // Log the error with context
  const logData = {
    timestamp: new Date().toISOString(),
    statusCode,
    reason,
    message,
    path: req.path,
    method: req.method,
    ...(req.file && {
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    }),
    ...(details && { details }),
  };

  // Log at appropriate level
  if (statusCode >= 500) {
    console.error('❌ Server Error:', logData);
    console.error('Stack trace:', err.stack);
  } else if (statusCode >= 400) {
    console.warn('⚠️  Client Error:', logData);
  } else {
    console.log('ℹ️  Request Error:', logData);
  }

  // Build error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      reason,
      ...(details && { details }),
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response) => {
  console.warn('⚠️  404 Not Found:', {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      reason: 'NOT_FOUND',
      details: {
        path: req.originalUrl,
        method: req.method,
      },
    },
  });
};
