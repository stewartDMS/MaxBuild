import { Router, Request, Response, NextFunction } from 'express';
import { TenderController } from '../controllers/tender.controller';
import upload, { handleMulterError } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const tenderController = new TenderController();

/**
 * POST /api/tenders/upload
 * Upload a tender PDF and extract BOQ
 */
router.post(
  '/upload',
  uploadRateLimiter,
  upload.single('tender'),
  handleMulterError,
  (req: Request, res: Response, next: NextFunction) => tenderController.uploadTender(req, res, next)
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
