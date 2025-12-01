import { Router, Request, Response } from 'express';
import tenderRoutes from './tender.routes';
import langgraphRoutes from './langgraph.routes';
import prisma from '../lib/prisma';

const router = Router();

/**
 * Get request ID for logging traceability
 */
function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

/**
 * POST /api/uploadtest
 * Simple diagnostic endpoint to verify backend upload route reachability.
 * Logs when hit and returns confirmation - no payload required.
 * 
 * Use this to verify the backend is reachable before testing actual file uploads.
 */
router.post('/uploadtest', (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const timestamp = new Date().toISOString();
  
  // Log detailed request info for debugging
  console.log(`[${requestId}] 🧪 UPLOADTEST HIT`, {
    timestamp,
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'] || 'none',
    contentLength: req.headers['content-length'] || '0',
    userAgent: req.headers['user-agent'] || 'unknown',
    origin: req.headers['origin'] || 'none',
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
  });
  
  console.log(`[${requestId}] ✅ UPLOADTEST SUCCESS - Backend upload routes are reachable`);
  
  res.status(200).json({
    success: true,
    message: 'Upload test endpoint reached successfully. Backend upload routes are reachable.',
    timestamp,
    requestId,
    debug: {
      contentType: req.headers['content-type'] || 'none',
      contentLength: req.headers['content-length'] || '0',
      hint: 'Use POST /api/tenders/upload with multipart/form-data and field name "tender" to upload files',
    },
  });
});

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
