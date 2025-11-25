/**
 * API service for tender-related operations
 */

// API base URL - uses Vite proxy in development
const API_BASE_URL = '/api';

/**
 * BOQ Item type from backend
 */
export interface BOQItem {
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
  };
  error?: {
    message: string;
  };
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
  error?: {
    message: string;
  };
}

/**
 * Upload a tender PDF file
 * @param file PDF file to upload
 * @param onProgress Optional progress callback
 * @returns Upload response with BOQ extraction
 */
export async function uploadTender(
  file: File,
  onProgress?: (progress: number) => void
): Promise<TenderUploadResponse> {
  const formData = new FormData();
  formData.append('tender', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

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
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          resolve({
            success: false,
            error: { message: response.error?.message || 'Upload failed' },
          });
        }
      } catch (parseError) {
        resolve({
          success: false,
          error: { message: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
        });
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('POST', `${API_BASE_URL}/tenders/upload`);
    xhr.send(formData);
  });
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
      error: { message: `Failed to fetch tenders: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
): Promise<{ success: boolean; data?: Tender; error?: { message: string } }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to fetch tender: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
): Promise<{ success: boolean; message?: string; error?: { message: string } }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenders/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete tender: ${error instanceof Error ? error.message : 'Unknown error'}` },
    };
  }
}
