/**
 * Standardized error classes and types for document ingestion
 */

/**
 * Base application error with structured information
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly reason: string;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    reason: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.reason = reason;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      message: this.message,
      reason: this.reason,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * File validation errors (400)
 */
export class FileValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'FILE_VALIDATION_ERROR', details);
  }
}

/**
 * File type not supported (400)
 */
export class UnsupportedFileTypeError extends AppError {
  constructor(fileType: string, supportedTypes: string[]) {
    super(
      `File type '${fileType}' is not supported`,
      400,
      'UNSUPPORTED_FILE_TYPE',
      {
        fileType,
        supportedTypes,
        suggestion: `Please upload one of the supported file types: ${supportedTypes.join(', ')}`,
      }
    );
  }
}

/**
 * File is corrupted or malformed (400)
 */
export class CorruptFileError extends AppError {
  constructor(fileType: string, details?: string) {
    super(
      `The ${fileType} file appears to be corrupted or malformed`,
      400,
      'CORRUPT_FILE',
      {
        fileType,
        ...(details && { details }),
        suggestion: 'Please ensure the file is not corrupted and try again',
      }
    );
  }
}

/**
 * File is password protected (400)
 */
export class PasswordProtectedFileError extends AppError {
  constructor(fileType: string) {
    super(
      `Cannot process password-protected ${fileType} files`,
      400,
      'PASSWORD_PROTECTED_FILE',
      {
        fileType,
        suggestion: 'Please remove the password protection and try again',
      }
    );
  }
}

/**
 * File is empty or has no extractable data (400)
 */
export class EmptyFileError extends AppError {
  constructor(fileType: string, details?: string) {
    super(
      `The ${fileType} file is empty or contains no extractable data`,
      400,
      'EMPTY_FILE',
      {
        fileType,
        ...(details && { details }),
        suggestion: 'Please ensure the file contains data and try again',
      }
    );
  }
}

/**
 * File structure is not suitable for BOQ extraction (400)
 */
export class InvalidStructureError extends AppError {
  constructor(fileType: string, issues: string[]) {
    super(
      `The ${fileType} file structure is not suitable for BOQ extraction`,
      400,
      'INVALID_STRUCTURE',
      {
        fileType,
        issues,
        suggestion: 'Expected columns like Item, Description, Quantity, Unit, Rate, Amount',
      }
    );
  }
}

/**
 * Missing required columns or sheets (400)
 */
export class MissingDataError extends AppError {
  constructor(message: string, missingElements: string[]) {
    super(
      message,
      400,
      'MISSING_DATA',
      {
        missingElements,
        suggestion: 'Please ensure the file contains all required data elements',
      }
    );
  }
}

/**
 * AI extraction failed (500)
 */
export class AIExtractionError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      500,
      'AI_EXTRACTION_FAILED',
      {
        ...details,
        suggestion: 'The AI service encountered an error. Please try again or contact support',
      }
    );
  }
}

/**
 * Document parsing error (500)
 */
export class ParsingError extends AppError {
  constructor(fileType: string, errorDetails: string) {
    super(
      `Failed to parse ${fileType} file`,
      500,
      'PARSING_ERROR',
      {
        fileType,
        errorDetails,
        suggestion: 'There was an error processing the file. Please try again',
      }
    );
  }
}

/**
 * File size exceeds limit (413)
 */
export class FileSizeLimitError extends AppError {
  constructor(fileSize: number, maxSize: number) {
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    
    super(
      `File size ${fileSizeMB}MB exceeds the maximum limit of ${maxSizeMB}MB`,
      413,
      'FILE_SIZE_LIMIT_EXCEEDED',
      {
        fileSize,
        maxSize,
        fileSizeMB,
        maxSizeMB,
        suggestion: `Please upload a file smaller than ${maxSizeMB}MB`,
      }
    );
  }
}

/**
 * No file uploaded (400)
 */
export class NoFileUploadedError extends AppError {
  constructor() {
    super(
      'No file was uploaded',
      400,
      'NO_FILE_UPLOADED',
      {
        suggestion: 'Please select a file to upload',
      }
    );
  }
}

/**
 * Resource not found (404)
 */
export class ResourceNotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(
      `${resourceType} with ID '${resourceId}' not found`,
      404,
      'RESOURCE_NOT_FOUND',
      {
        resourceType,
        resourceId,
      }
    );
  }
}
