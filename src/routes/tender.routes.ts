import { Router } from 'express';
import { TenderController } from '../controllers/tender.controller';
import upload from '../middleware/upload.middleware';

const router = Router();
const tenderController = new TenderController();

/**
 * POST /api/tenders/upload
 * Upload a tender PDF and extract BOQ
 */
router.post(
  '/upload',
  upload.single('tender'),
  (req, res, next) => tenderController.uploadTender(req, res, next)
);

/**
 * GET /api/tenders
 * List all tenders
 */
router.get(
  '/',
  (req, res, next) => tenderController.listTenders(req, res, next)
);

/**
 * GET /api/tenders/:id
 * Get a specific tender by ID
 */
router.get(
  '/:id',
  (req, res, next) => tenderController.getTender(req, res, next)
);

/**
 * DELETE /api/tenders/:id
 * Delete a tender
 */
router.delete(
  '/:id',
  (req, res, next) => tenderController.deleteTender(req, res, next)
);

export default router;
