import { Router } from 'express';
import tenderRoutes from './tender.routes';
import langgraphRoutes from './langgraph.routes';
import prisma from '../lib/prisma';

const router = Router();

/**
 * Health check endpoint that tests both API liveliness and PostgreSQL DB connectivity.
 * 
 * - Performs a simple DB query (SELECT 1) via Prisma to verify database connectivity.
 * - On success: returns { success: true, db: 'connected', timestamp }
 * - On failure: returns { success: false, db: 'error', message, error }
 */
router.get('/health', async (req, res) => {
  try {
    // Attempt a simple database query to verify connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Database is reachable - return success response
    res.status(200).json({
      success: true,
      message: 'MAX Build API is running',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Database is unreachable or threw an error - return error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    res.status(503).json({
      success: false,
      message: 'MAX Build API is running but database is unavailable',
      db: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
router.use('/tenders', tenderRoutes);
router.use('/langgraph', langgraphRoutes);

export default router;
