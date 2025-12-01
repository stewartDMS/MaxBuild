import { Router, Request, Response, NextFunction } from 'express';
import { TenderController } from '../controllers/tender.controller';
import upload, { handleMulterError } from '../middleware/upload.middleware';
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
 * - tender: File to upload
 * - context: Optional extraction context/instructions
 * - requiresReview: If "true", saves to pending_review status for user confirmation
 */
router.post(
  '/upload',
  // Log entry to upload route
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    console.log(`[${requestId}] 🚪 ENTRY: Upload route handler started`, {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    });
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
  // Log after multer file processing
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    console.log(`[${requestId}] 📁 Multer file processing completed`, {
      fileReceived: !!req.file,
      fileSize: req.file?.size || 0,
      mimeType: req.file?.mimetype || 'N/A',
    });
    next();
  },
  handleMulterError,
  // Log after validation/multer error handling passes
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    console.log(`[${requestId}] ✅ File validation passed, proceeding to controller`);
    next();
  },
  asyncHandler((req: Request, res: Response, next: NextFunction) => 
    tenderController.uploadTender(req, res, next)
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
