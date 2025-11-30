/**
 * API service for tender-related operations
 */

// API base URL - uses Vite proxy in development
const API_BASE_URL = '/api';

/**
 * BOQ Item type from backend
 */
export interface BOQItem {
  id?: string;
  itemNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate?: number;
  amount?: number;
  category?: string;
}

/**
 * BOQ Extraction result from backend
 */
export interface BOQExtraction {
  projectName?: string;
  projectLocation?: string;
  items: BOQItem[];
  totalEstimatedCost?: number;
  currency: string;
  extractionDate: string;
  notes?: string;
}

/**
 * Standardized error response from backend
 */
export interface ErrorResponse {
  message: string;
  reason: string;
  details?: Record<string, unknown>;
}

/**
 * Review log entry from backend
 */
export interface ReviewLog {
  id: string;
  tenderId: string;
  action: string;
  details?: string;
  userId?: string;
  ipAddress?: string;
  createdAt: string;
}

/**
 * Tender upload response from backend
 */
export interface TenderUploadResponse {
  success: boolean;
  data?: {
    tenderId: string;
    fileName: string;
    status: string;
    boqExtraction: BOQExtraction;
    itemCount: number;
    extractedText?: string;
  };
  error?: ErrorResponse;
}

/**
 * Review action response from backend
 */
export interface ReviewActionResponse {
  success: boolean;
  data?: {
    tenderId: string;
    action: string;
    status: string;
    message: string;
  };
  error?: ErrorResponse;
}

/**
 * Tender item from backend
 */
export interface Tender {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedText?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  boqs: BOQItem[];
  reviewLogs?: ReviewLog[];
}

/**
 * List tenders response from backend
 */
export interface ListTendersResponse {
  success: boolean;
  data?: Tender[];
  pagination?: {
    skip: number;
    take: number;
    count: number;
  };
  error?: ErrorResponse;
}

/**
 * Upload a tender file (PDF, Excel, or CSV)
 * @param file File to upload
 * @param context Optional extraction context/instructions for the AI
 * @param requiresReview If true, saves to pending_review status for user confirmation
 * @param onProgress Optional progress callback
 * @returns Upload response with BOQ extraction
 */
export async function uploadTender(
  file: File,
  context?: string,
  requiresReview: boolean = false,
  onProgress?: (progress: number) => void
): Promise<TenderUploadResponse> {
  const formData = new FormData();
  formData.append('tender', file);
  
  // Add context if provided
  if (context) {
    formData.append('context', context);
  }

  // Add requiresReview flag
  if (requiresReview) {
    formData.append('requiresReview', 'true');
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Set a longer timeout for AI processing (5 minutes)
    // AI extraction can take considerable time depending on document complexity
    xhr.timeout = 5 * 60 * 1000; // 5 minutes

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        // Check if response has content
        if (!xhr.responseText || xhr.responseText.trim() === '') {
          resolve({
            success: false,
            error: { 
              message: 'Server returned an empty response. This may indicate a server timeout or configuration issue.',
              reason: 'EMPTY_RESPONSE',
              details: {
                statusCode: xhr.status,
                suggestion: 'Please try again. If the issue persists, contact support.',
              },
            },
          });
          return;
        }

        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          // Return structured error response
          resolve({
            success: false,
            error: response.error || { 
              message: 'Upload failed',
              reason: 'UNKNOWN_ERROR',
            },
          });
        }
      } catch (parseError) {
        resolve({
          success: false,
          error: { 
            message: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            reason: 'PARSE_ERROR',
            details: {
              statusCode: xhr.status,
              responseText: xhr.responseText.substring(0, 200), // Include first 200 chars for debugging
            },
          },
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: {
          message: 'Network error occurred while uploading the file',
          reason: 'NETWORK_ERROR',
          details: {
            suggestion: 'Please check your internet connection and try again.',
          },
        },
      });
    });

    xhr.addEventListener('abort', () => {
      resolve({
        success: false,
        error: {
          message: 'Upload was cancelled',
          reason: 'UPLOAD_ABORTED',
        },
      });
    });

    xhr.addEventListener('timeout', () => {
      resolve({
        success: false,
        error: {
          message: 'Request timed out. The file may be too large or the server is taking too long to process.',
          reason: 'REQUEST_TIMEOUT',
          details: {
            suggestion: 'Please try uploading a smaller file or try again later.',
          },
        },
      });
    });

    xhr.open('POST', `${API_BASE_URL}/tenders/upload`);
    xhr.send(formData);
  });
}

/**
 * Approve and finalize a tender after user review
 * @param tenderId Tender ID to approve
 * @param items Optional array of edited BOQ items to save
 * @returns Review action response
 */
export async function approveTender(
  tenderId: string,
  items?: BOQItem[]
): Promise<ReviewActionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${tenderId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to approve tender: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Reject a tender extraction
 * @param tenderId Tender ID to reject
 * @param reason Optional rejection reason
 * @returns Review action response
 */
export async function rejectTender(
  tenderId: string,
  reason?: string
): Promise<ReviewActionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${tenderId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to reject tender: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Update BOQ items for a tender
 * @param tenderId Tender ID
 * @param items Array of BOQ items to save
 * @returns Updated tender with BOQ items
 */
export async function updateBOQItems(
  tenderId: string,
  items: BOQItem[]
): Promise<{ success: boolean; data?: Tender; error?: ErrorResponse }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${tenderId}/items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to update BOQ items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Get review logs for a tender
 * @param tenderId Tender ID
 * @returns Array of review log entries
 */
export async function getReviewLogs(
  tenderId: string
): Promise<{ success: boolean; data?: ReviewLog[]; error?: ErrorResponse }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${tenderId}/review-logs`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to fetch review logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * List all tenders
 * @param skip Number of records to skip
 * @param take Number of records to return
 * @returns List of tenders
 */
export async function listTenders(
  skip = 0,
  take = 10
): Promise<ListTendersResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tenders?skip=${skip}&take=${take}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to fetch tenders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Get a specific tender by ID
 * @param id Tender ID
 * @returns Tender details
 */
export async function getTender(
  id: string
): Promise<{ success: boolean; data?: Tender; error?: ErrorResponse }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to fetch tender: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Delete a tender
 * @param id Tender ID
 * @returns Success status
 */
export async function deleteTender(
  id: string
): Promise<{ success: boolean; message?: string; error?: ErrorResponse }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { 
        message: `Failed to delete tender: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: 'NETWORK_ERROR',
      },
    };
  }
}
