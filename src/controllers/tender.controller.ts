import { Request, Response, NextFunction } from 'express';
import { TenderService } from '../services/tender.service';
import { MockTenderService } from '../services/mock-tender.service';
import { NoFileUploadedError, ResourceNotFoundError, MissingParameterError } from '../lib/errors';
import fs from 'fs/promises';

/**
 * Controller for tender-related operations
 */
export class TenderController {
  private tenderService: TenderService;
  private mockTenderService: MockTenderService;

  constructor(tenderService?: TenderService) {
    this.tenderService = tenderService || new TenderService();
    this.mockTenderService = new MockTenderService();
  }

  /**
   * Upload and process a tender PDF
   * POST /api/tenders/upload
   * 
   * Body parameters:
   * - tender: File to upload
   * - context: Optional extraction context/instructions
   * - requiresReview: If "true", saves to pending_review status for user confirmation
   */
  async uploadTender(req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId || 'unknown';
    console.log(`[${requestId}] 📤 Upload tender request received`);
    
    try {
      if (!req.file) {
        console.warn(`[${requestId}] ⚠️ No file uploaded`);
        throw new NoFileUploadedError();
      }

      const { path: filePath, originalname, size, mimetype } = req.file;
      const context = req.body.context; // Optional user-provided extraction context
      // Parse requiresReview as boolean (defaults to false for backward compatibility)
      const requiresReview = req.body.requiresReview === 'true' || req.body.requiresReview === true;

      console.log(`[${requestId}] 📄 Processing tender upload:`, {
        fileName: originalname,
        fileSize: `${(size / 1024).toFixed(2)} KB`,
        mimeType: mimetype,
        hasContext: !!context,
        requiresReview,
        filePath,
      });

      // Process the tender
      const result = await this.tenderService.processTender(
        filePath,
        originalname,
        size,
        mimetype,
        context,
        requiresReview
      );

      // Clean up the uploaded file after processing
      await fs.unlink(filePath).catch((err) => {
        console.warn(`[${requestId}] ⚠️ Failed to delete uploaded file:`, err);
      });

      console.log(`[${requestId}] ✅ Tender processed successfully:`, {
        tenderId: result.tenderId,
        itemCount: result.itemCount,
        status: result.status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(`[${requestId}] ❌ Error in uploadTender:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Clean up file on error if it exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch((err) => {
          console.warn(`[${requestId}] ⚠️ Failed to delete uploaded file after error:`, err);
        });
      }
      next(error);
    }
  }

  /**
   * Approve and finalize a tender after user review
   * POST /api/tenders/:id/approve
   * 
   * Body parameters:
   * - items: Optional array of edited BOQ items to save
   */
  async approveTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { items } = req.body;
      
      // Get client IP for audit logging
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;

      const result = await this.tenderService.approveTender(id, items, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a tender extraction
   * POST /api/tenders/:id/reject
   * 
   * Body parameters:
   * - reason: Optional rejection reason
   */
  async rejectTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Get client IP for audit logging
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;

      const result = await this.tenderService.rejectTender(id, reason, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update BOQ items for a tender
   * PUT /api/tenders/:id/items
   * 
   * Body parameters:
   * - items: Array of BOQ items to save
   */
  async updateBOQItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Items array is required',
            reason: 'VALIDATION_ERROR',
          },
        });
      }

      // Get client IP for audit logging
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;

      const result = await this.tenderService.updateBOQItems(id, items, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get review logs for a tender
   * GET /api/tenders/:id/review-logs
   */
  async getReviewLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const logs = await this.tenderService.getReviewLogs(id);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific tender by ID
   * GET /api/tenders/:id
   */
  async getTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tender = await this.tenderService.getTender(id);

      if (!tender) {
        throw new ResourceNotFoundError('Tender', id);
      }

      res.status(200).json({
        success: true,
        data: tender,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all tenders
   * GET /api/tenders
   */
  async listTenders(req: Request, res: Response, next: NextFunction) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 10;

      const tenders = await this.tenderService.listTenders(skip, take);

      res.status(200).json({
        success: true,
        data: tenders,
        pagination: {
          skip,
          take,
          count: tenders.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a tender
   * DELETE /api/tenders/:id
   */
  async deleteTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await this.tenderService.deleteTender(id);

      res.status(200).json({
        success: true,
        message: 'Tender deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mock Upload - Demonstrates end-to-end tender processing flow
   * POST /api/tenders/upload-mock
   * 
   * This endpoint is for DEMONSTRATION PURPOSES ONLY.
   * It simulates the complete tender processing flow without requiring:
   * - Database connection
   * - OpenAI API key
   * - LangGraph API key
   * 
   * The flow demonstrates:
   * 1. File Upload - Receiving uploaded files
   * 2. File Parsing/Reading - Extracting content from documents
   * 3. Mock Analysis - Simulating AI-powered BOQ extraction
   * 4. Document Generation - Creating result documents
   * 5. Result Sending - Returning processed data
   * 
   * Body parameters:
   * - tender: File to upload (optional - will use mock data if not provided)
   * - context: Optional extraction context/instructions
   */
  async uploadMockTender(req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId || 'unknown';
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           MOCK TENDER UPLOAD - DEMO FLOW                   ║');
    console.log('║   This is a demonstration endpoint for team alignment      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`[${requestId}] 🎭 Mock upload tender request received`);
    
    try {
      // Get file info if uploaded, otherwise use mock defaults
      let fileName = 'demo-tender-document.pdf';
      let fileSize = 1024 * 500; // 500KB mock size
      let mimeType = 'application/pdf';
      let fileBuffer: Buffer | null = null;

      if (req.file) {
        // Real file was uploaded
        fileName = req.file.originalname;
        fileSize = req.file.size;
        mimeType = req.file.mimetype;
        
        // Read file buffer for potential content preview
        try {
          fileBuffer = await fs.readFile(req.file.path);
        } catch {
          console.log(`[${requestId}] ⚠️ Could not read file buffer (non-critical for mock)`);
        }

        console.log(`[${requestId}] 📄 Real file detected:`, {
          fileName,
          fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
          mimeType,
        });
      } else {
        console.log(`[${requestId}] 📄 No file uploaded - using mock file data`);
      }

      const context = req.body?.context;
      if (context) {
        console.log(`[${requestId}] 📝 Extraction context provided: "${context}"`);
      }

      // Process using mock service
      const result = await this.mockTenderService.processMockTender(
        fileBuffer,
        fileName,
        fileSize,
        mimeType,
        context
      );

      // Clean up uploaded file if it exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch((err) => {
          console.warn(`[${requestId}] ⚠️ Failed to delete uploaded file:`, err);
        });
      }

      console.log(`[${requestId}] ✅ Mock tender processing completed successfully`);
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║              DEMO FLOW COMPLETED SUCCESSFULLY              ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      res.status(200).json({
        success: true,
        message: 'Mock tender processed successfully. This is a demonstration response.',
        isDemo: true,
        data: result,
      });
    } catch (error) {
      console.error(`[${requestId}] ❌ Error in mock upload:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Clean up file on error if it exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      next(error);
    }
  }
}
