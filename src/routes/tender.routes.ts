import { Router, Request, Response, NextFunction } from 'express';
import { TenderController } from '../controllers/tender.controller';
import upload, { handleMulterError, mockUpload } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rate-limit.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();
const tenderController = new TenderController();

/**
 * Get or generate a request ID for tracing
 * Uses the existing request ID set by middleware, or 'unknown' as fallback
 */
function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

/**
 * POST /api/tenders/upload
 * Upload a tender PDF and extract BOQ
 * 
 * Body parameters:
 * - tender: File to upload (multipart/form-data)
 * - context: Optional extraction context/instructions
 * - requiresReview: If "true", saves to pending_review status for user confirmation
 * 
 * Debug Notes:
 * - Use POST /api/uploadtest first to verify backend reachability
 * - Ensure Content-Type is multipart/form-data
 * - File field name must be "tender"
 */
router.post(
  '/upload',
  // DIAGNOSTIC: Always log when this route is hit, regardless of request format
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    const timestamp = new Date().toISOString();
    const contentType = req.headers['content-type'] || 'none';
    const contentLength = req.headers['content-length'] || '0';
    
    console.log(`[${requestId}] ========================================`);
    console.log(`[${requestId}] 🚪 UPLOAD ROUTE HIT - POST /api/tenders/upload`);
    console.log(`[${requestId}] ========================================`);
    console.log(`[${requestId}] 📋 Request Details:`, {
      timestamp,
      method: req.method,
      path: req.path,
      fullUrl: req.originalUrl,
      contentType,
      contentLength,
      userAgent: req.headers['user-agent'] || 'unknown',
      origin: req.headers['origin'] || 'none',
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    });
    
    // Check for common issues and warn early
    if (!contentType.includes('multipart/form-data')) {
      console.warn(`[${requestId}] ⚠️ WARNING: Content-Type is not multipart/form-data`);
      console.warn(`[${requestId}] 💡 Expected: multipart/form-data, Got: ${contentType}`);
      console.warn(`[${requestId}] 💡 Hint: Use -F "tender=@file.pdf" with curl, not -d`);
    }
    
    if (contentLength === '0') {
      console.warn(`[${requestId}] ⚠️ WARNING: Content-Length is 0 - request body may be empty`);
    }
    
    next();
  },
  uploadRateLimiter,
  // Log after rate limiting passes
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    console.log(`[${requestId}] ✅ Rate limit check passed`);
    next();
  },
  upload.single('tender'),
  // Log after multer file processing with detailed diagnostics
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] 📁 Multer file processing completed`, {
      timestamp,
      fileReceived: !!req.file,
      fileSize: req.file?.size || 0,
      mimeType: req.file?.mimetype || 'N/A',
      originalName: req.file?.originalname || 'N/A',
      fieldname: req.file?.fieldname || 'N/A',
    });
    
    // Detailed warning if no file was received
    if (!req.file) {
      console.warn(`[${requestId}] ⚠️ NO FILE RECEIVED after Multer processing`);
      console.warn(`[${requestId}] 💡 Troubleshooting tips:`);
      console.warn(`[${requestId}]    1. Ensure Content-Type is multipart/form-data`);
      console.warn(`[${requestId}]    2. Use field name "tender" for the file`);
      console.warn(`[${requestId}]    3. Example: curl -F "tender=@yourfile.pdf" http://localhost:3000/api/tenders/upload`);
      console.warn(`[${requestId}]    4. Check that the file exists and is readable`);
    }
    
    next();
  },
  handleMulterError,
  // Handle file validation result and respond with helpful error if no file
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    
    if (req.file) {
      console.log(`[${requestId}] ✅ File validation passed, proceeding to controller`);
      return next();
    }
    
    // No file was uploaded - return helpful error response
    const timestamp = new Date().toISOString();
    console.error(`[${requestId}] ❌ UPLOAD FAILED: No file provided`);
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'No file was uploaded. Please include a file in your request.',
        reason: 'NO_FILE_UPLOADED',
        details: {
          receivedContentType: req.headers['content-type'] || 'none',
          expectedContentType: 'multipart/form-data',
          expectedFieldName: 'tender',
          suggestion: 'Ensure you are sending a multipart/form-data request with the file in a field named "tender"',
          examples: {
            curl: 'curl -X POST -F "tender=@yourfile.pdf" http://localhost:3000/api/tenders/upload',
            postman: 'Use form-data body type with key "tender" (type: File)',
          },
        },
      },
      timestamp,
      requestId,
    });
  },
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.uploadTender(req, res, next)
  )
);

/**
 * POST /api/tenders/upload-mock
 * Mock/Demo endpoint for demonstrating the tender processing flow
 * 
 * This endpoint is for DEMONSTRATION AND TEAM ALIGNMENT ONLY.
 * It simulates the complete end-to-end tender processing flow without requiring:
 * - PostgreSQL database connection
 * - OpenAI API key
 * - LangGraph API key
 * - Any external services
 * 
 * Body parameters (all optional):
 * - tender: File to upload (multipart/form-data) - uses mock data if not provided
 * - context: Optional extraction context/instructions to guide mock analysis
 * 
 * The flow demonstrates with detailed console logs:
 * 1. FILE_UPLOAD - File reception and validation
 * 2. FILE_PARSING - Document content extraction
 * 3. AI_ANALYSIS - Mock BOQ extraction simulation
 * 4. DOCUMENT_GENERATION - Result document creation
 * 5. RESULT_SENDING - Response preparation
 */
router.post(
  '/upload-mock',
  // Log when mock route is hit
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] ========================================`);
    console.log(`[${requestId}] 🎭 MOCK UPLOAD ROUTE HIT - POST /api/tenders/upload-mock`);
    console.log(`[${requestId}] ========================================`);
    console.log(`[${requestId}] ℹ️ This is a DEMO endpoint for team alignment`);
    console.log(`[${requestId}] 📋 Request received at: ${timestamp}`);
    
    next();
  },
  // Optional file upload - mock works without a file too (accepts any file type)
  mockUpload.single('tender'),
  handleMulterError,
  // Don't require file - mock endpoint works without one
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    if (req.file) {
      console.log(`[${requestId}] 📁 File provided for mock processing:`, {
        name: req.file.originalname,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        type: req.file.mimetype,
      });
    } else {
      console.log(`[${requestId}] 📄 No file provided - will use mock data`);
    }
    next();
  },
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.uploadMockTender(req, res, next)
  )
);

/**
 * POST /api/tenders/:id/approve
 * Approve and finalize a tender after user review
 * 
 * Body parameters:
 * - items: Optional array of edited BOQ items to save
 */
router.post(
  '/:id/approve',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.approveTender(req, res, next)
  )
);

/**
 * POST /api/tenders/:id/reject
 * Reject a tender extraction
 * 
 * Body parameters:
 * - reason: Optional rejection reason
 */
router.post(
  '/:id/reject',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.rejectTender(req, res, next)
  )
);

/**
 * PUT /api/tenders/:id/items
 * Update BOQ items for a tender
 * 
 * Body parameters:
 * - items: Array of BOQ items to save
 */
router.put(
  '/:id/items',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.updateBOQItems(req, res, next)
  )
);

/**
 * GET /api/tenders/:id/review-logs
 * Get review logs for a tender
 */
router.get(
  '/:id/review-logs',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.getReviewLogs(req, res, next)
  )
);

/**
 * GET /api/tenders
 * List all tenders
 */
router.get(
  '/',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.listTenders(req, res, next)
  )
);

/**
 * GET /api/tenders/:id
 * Get a specific tender by ID
 */
router.get(
  '/:id',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.getTender(req, res, next)
  )
);

/**
 * DELETE /api/tenders/:id
 * Delete a tender
 */
router.delete(
  '/:id',
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.deleteTender(req, res, next)
  )
);

export default router;
