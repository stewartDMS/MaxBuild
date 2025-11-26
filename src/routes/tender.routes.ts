import { Router, Request, Response, NextFunction } from 'express';
import { TenderController } from '../controllers/tender.controller';
import upload, { handleMulterError } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const tenderController = new TenderController();

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
  uploadRateLimiter,
  upload.single('tender'),
  handleMulterError,
  (req: Request, res: Response, next: NextFunction) => tenderController.uploadTender(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => tenderController.approveTender(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => tenderController.rejectTender(req, res, next)
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
  (req: Request, res: Response, next: NextFunction) => tenderController.updateBOQItems(req, res, next)
);

/**
 * GET /api/tenders/:id/review-logs
 * Get review logs for a tender
 */
router.get(
  '/:id/review-logs',
  (req: Request, res: Response, next: NextFunction) => tenderController.getReviewLogs(req, res, next)
);

/**
 * GET /api/tenders
 * List all tenders
 */
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => tenderController.listTenders(req, res, next)
);

/**
 * GET /api/tenders/:id
 * Get a specific tender by ID
 */
router.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => tenderController.getTender(req, res, next)
);

/**
 * DELETE /api/tenders/:id
 * Delete a tender
 */
router.delete(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => tenderController.deleteTender(req, res, next)
);

export default router;
