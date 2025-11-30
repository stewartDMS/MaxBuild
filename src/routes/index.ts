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
    // Using $executeRaw since we don't need the query result
    await prisma.$executeRaw`SELECT 1 as health`;
    
    // Database is reachable - return success response
    res.status(200).json({
      success: true,
      message: 'MAX Build API is running',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Database is unreachable or threw an error - log full details server-side
    const fullErrorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Health check database error:', fullErrorMessage);
    
    // Return a generic error message to avoid exposing sensitive database details
    res.status(503).json({
      success: false,
      message: 'MAX Build API is running but database is unavailable',
      db: 'error',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
router.use('/tenders', tenderRoutes);
router.use('/langgraph', langgraphRoutes);

export default router;
