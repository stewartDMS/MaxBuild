import { Request, Response, NextFunction } from 'express';
import { TenderService } from '../services/tender.service';
import { NoFileUploadedError, ResourceNotFoundError } from '../lib/errors';
import fs from 'fs/promises';

/**
 * Controller for tender-related operations
 */
export class TenderController {
  private tenderService: TenderService;

  constructor(tenderService?: TenderService) {
    this.tenderService = tenderService || new TenderService();
  }

  /**
   * Upload and process a tender PDF
   * POST /api/tenders/upload
   */
  async uploadTender(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new NoFileUploadedError();
      }

      const { path: filePath, originalname, size, mimetype } = req.file;

      console.log('📄 Processing tender upload:', {
        fileName: originalname,
        fileSize: `${(size / 1024).toFixed(2)} KB`,
        mimeType: mimetype,
      });

      // Process the tender
      const result = await this.tenderService.processTender(
        filePath,
        originalname,
        size,
        mimetype
      );

      // Clean up the uploaded file after processing
      await fs.unlink(filePath).catch((err) => {
        console.warn('⚠️  Failed to delete uploaded file:', err);
      });

      console.log('✅ Tender processed successfully:', {
        tenderId: result.tenderId,
        itemCount: result.itemCount,
        status: result.status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Clean up file on error if it exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch((err) => {
          console.warn('⚠️  Failed to delete uploaded file after error:', err);
        });
      }
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
}
