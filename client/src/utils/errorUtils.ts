import type { ErrorResponse } from '../api/tenderApi';

/**
 * Format error message with details for user-friendly display
 */
export function formatErrorMessage(error: ErrorResponse): {
  title: string;
  message: string;
  suggestion?: string;
} {
  const { message, reason, details } = error;

  // Map error reasons to user-friendly titles
  const errorTitles: Record<string, string> = {
    FILE_VALIDATION_ERROR: 'Invalid File',
    UNSUPPORTED_FILE_TYPE: 'Unsupported File Type',
    CORRUPT_FILE: 'Corrupted File',
    PASSWORD_PROTECTED_FILE: 'Password Protected',
    EMPTY_FILE: 'Empty File',
    INVALID_STRUCTURE: 'Invalid File Structure',
    MISSING_DATA: 'Missing Data',
    AI_EXTRACTION_FAILED: 'Extraction Failed',
    PARSING_ERROR: 'Processing Error',
    FILE_SIZE_LIMIT_EXCEEDED: 'File Too Large',
    NO_FILE_UPLOADED: 'No File Selected',
    RESOURCE_NOT_FOUND: 'Not Found',
    NETWORK_ERROR: 'Network Error',
    PARSE_ERROR: 'Response Error',
    UNKNOWN_ERROR: 'Error',
  };

  const title = errorTitles[reason] || 'Upload Failed';

  // Get suggestion from details if available
  const suggestion = details?.suggestion;

  return {
    title,
    message,
    suggestion,
  };
}

/**
 * Get severity level for error (for toast notifications)
 */
export function getErrorSeverity(reason: string): 'error' | 'warning' | 'info' {
  // Client-side validation errors are warnings
  if (
    reason === 'FILE_VALIDATION_ERROR' ||
    reason === 'UNSUPPORTED_FILE_TYPE' ||
    reason === 'FILE_SIZE_LIMIT_EXCEEDED' ||
    reason === 'NO_FILE_UPLOADED'
  ) {
    return 'warning';
  }

  // File content issues are errors but can be fixed
  if (
    reason === 'CORRUPT_FILE' ||
    reason === 'PASSWORD_PROTECTED_FILE' ||
    reason === 'EMPTY_FILE' ||
    reason === 'INVALID_STRUCTURE' ||
    reason === 'MISSING_DATA'
  ) {
    return 'error';
  }

  // Server/AI errors are critical
  return 'error';
}

/**
 * Check if error has actionable details for the user
 */
export function hasActionableDetails(error: ErrorResponse): boolean {
  return !!(
    error.details?.suggestion ||
    error.details?.supportedTypes ||
    error.details?.issues ||
    error.details?.missingElements
  );
}

/**
 * Format detailed error information for display
 */
export function formatErrorDetails(error: ErrorResponse): string[] {
  const details: string[] = [];

  if (error.details?.supportedTypes && Array.isArray(error.details.supportedTypes)) {
    details.push(`Supported types: ${error.details.supportedTypes.join(', ')}`);
  }

  if (error.details?.issues && Array.isArray(error.details.issues)) {
    details.push(...error.details.issues);
  }

  if (error.details?.missingElements && Array.isArray(error.details.missingElements)) {
    details.push(`Missing: ${error.details.missingElements.join(', ')}`);
  }

  if (error.details?.fileSizeMB && error.details?.maxSizeMB) {
    details.push(`File size: ${error.details.fileSizeMB}MB (max: ${error.details.maxSizeMB}MB)`);
  }

  return details;
}
