import { Router } from 'express';
import tenderRoutes from './tender.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MAX Build API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/tenders', tenderRoutes);

export default router;
