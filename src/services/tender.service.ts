import prisma from '../lib/prisma';
import { PDFLoader } from '../ai/loaders/pdf.loader';
import { BOQGenerationChain } from '../ai/chains/boq-generation.chain';
import { ExcelService } from './excel.service';
import { CSVService } from './csv.service';
import { UnsupportedFileTypeError, EmptyFileError, ResourceNotFoundError } from '../lib/errors';
import type { BOQExtraction, BOQItem } from '../ai/schemas/boq.schema';

export interface TenderUploadResult {
  tenderId: string;
  fileName: string;
  status: string;
  boqExtraction: BOQExtraction;
  itemCount: number;
}

export interface TenderPreviewResult {
  tenderId: string;
  fileName: string;
  status: 'pending_review';
  boqExtraction: BOQExtraction;
  itemCount: number;
  extractedText: string;
}

export interface ReviewActionResult {
  tenderId: string;
  action: string;
  status: string;
  message: string;
}

export interface BOQItemUpdate {
  id?: string;
  itemNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate?: number;
  amount?: number;
  category?: string;
}

/**
 * Service for handling tender document processing
 */
export class TenderService {
  private pdfLoader: PDFLoader;
  private boqChain: BOQGenerationChain;
  private excelService: ExcelService;
  private csvService: CSVService;

  constructor() {
    this.pdfLoader = new PDFLoader();
    this.boqChain = new BOQGenerationChain();
    this.excelService = new ExcelService();
    this.csvService = new CSVService();
  }

  /**
   * Process an uploaded tender PDF, Excel, or CSV file
   * @param filePath Path to the uploaded file
   * @param fileName Original file name
   * @param fileSize File size in bytes
   * @param mimeType MIME type of the file
   * @param context Optional user-provided extraction context/instructions
   * @param requiresReview If true, saves to pending_review status for user confirmation (default: false for backward compatibility)
   * @returns Processing result with BOQ extraction
   */
  async processTender(
    filePath: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    context?: string,
    requiresReview: boolean = false
  ): Promise<TenderUploadResult | TenderPreviewResult> {
    console.log('🚀 Starting tender processing:', { fileName, fileSize, mimeType, hasContext: !!context, requiresReview });
    
    let extractedText: string;
    let boqExtraction: BOQExtraction;

    // Detect file type and dispatch to appropriate parser
    const isExcel = this.isExcelFile(mimeType);
    const isCSV = this.isCSVFile(mimeType);
    const isPDF = mimeType === 'application/pdf';

    if (!isPDF && !isExcel && !isCSV) {
      throw new UnsupportedFileTypeError(mimeType, [
        'PDF (.pdf)',
        'Excel (.xlsx, .xls)',
        'CSV (.csv)',
      ]);
    }

    try {
      if (isCSV) {
        // Process CSV file
        console.log('📊 Processing CSV file...');
        const result = await this.csvService.processCSV(filePath, context);
        extractedText = result.extractedText;
        boqExtraction = result.boqExtraction;
      } else if (isExcel) {
        // Process Excel file
        console.log('📊 Processing Excel file...');
        const result = await this.excelService.processExcel(filePath, context);
        extractedText = result.extractedText;
        boqExtraction = result.boqExtraction;
      } else {
        // Process PDF file
        console.log('📄 Processing PDF file...');
        extractedText = await this.pdfLoader.load(filePath);

        if (!extractedText || extractedText.trim().length === 0) {
          throw new EmptyFileError('PDF', 'No text could be extracted from the PDF');
        }

        // Run BOQ generation chain
        boqExtraction = await this.boqChain.run(extractedText, context);
      }

      // Determine the target status based on review requirement
      const targetStatus = requiresReview ? 'pending_review' : 'completed';

      // Create tender record in database
      console.log('💾 Creating tender record...');
      const tender = await prisma.tender.create({
        data: {
          fileName,
          fileSize,
          mimeType,
          extractedText,
          extractionContext: context || null,
          status: requiresReview ? 'pending_review' : 'processing',
        },
      });

      // Save BOQ items to database (even for review mode, so they can be edited)
      console.log('💾 Saving BOQ items...');
      const boqItems = boqExtraction.items.map((item) => ({
        tenderId: tender.id,
        itemNumber: item.itemNumber,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitRate: item.unitRate,
        amount: item.amount,
        category: item.category,
      }));

      await prisma.bOQ.createMany({
        data: boqItems,
      });

      // Update tender status (for non-review mode)
      if (!requiresReview) {
        await prisma.tender.update({
          where: { id: tender.id },
          data: { status: 'completed' },
        });
      }

      console.log(`✅ Tender processing completed (${targetStatus}):`, {
        tenderId: tender.id,
        itemCount: boqItems.length,
      });

      if (requiresReview) {
        return {
          tenderId: tender.id,
          fileName,
          status: 'pending_review',
          boqExtraction,
          itemCount: boqItems.length,
          extractedText,
        } as TenderPreviewResult;
      }

      return {
        tenderId: tender.id,
        fileName,
        status: 'completed',
        boqExtraction,
        itemCount: boqItems.length,
      };
    } catch (error) {
      console.error('❌ Error processing tender:', {
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a tender by ID with its BOQ items
   */
  async getTender(tenderId: string) {
    return await prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        boqs: true,
        reviewLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * List all tenders
   */
  async listTenders(skip = 0, take = 10) {
    return await prisma.tender.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        boqs: true,
      },
    });
  }

  /**
   * Delete a tender
   */
  async deleteTender(tenderId: string) {
    return await prisma.tender.delete({
      where: { id: tenderId },
    });
  }

  /**
   * Approve and finalize a tender after user review
   * @param tenderId Tender ID to approve
   * @param editedItems Optional array of edited BOQ items to save
   * @param ipAddress Optional IP address for audit logging
   * @param userId Optional user ID for audit logging
   * @returns Review action result
   */
  async approveTender(
    tenderId: string,
    editedItems?: BOQItemUpdate[],
    ipAddress?: string,
    userId?: string
  ): Promise<ReviewActionResult> {
    console.log('✅ Approving tender:', { tenderId, hasEditedItems: !!editedItems });

    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: { boqs: true },
    });

    if (!tender) {
      throw new ResourceNotFoundError('Tender', tenderId);
    }

    // If edited items are provided, update the BOQ items
    if (editedItems && editedItems.length > 0) {
      // Delete existing BOQ items and create new ones
      await prisma.bOQ.deleteMany({
        where: { tenderId },
      });

      const boqItems = editedItems.map((item) => ({
        tenderId,
        itemNumber: item.itemNumber,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitRate: item.unitRate,
        amount: item.amount,
        category: item.category,
      }));

      await prisma.bOQ.createMany({
        data: boqItems,
      });

      // Log the edit action
      await this.logReviewAction(tenderId, 'edited', {
        originalItemCount: tender.boqs.length,
        newItemCount: editedItems.length,
      }, ipAddress, userId);
    }

    // Update tender status to completed
    await prisma.tender.update({
      where: { id: tenderId },
      data: { status: 'completed' },
    });

    // Log the approval action
    await this.logReviewAction(tenderId, 'approved', {
      previousStatus: tender.status,
    }, ipAddress, userId);

    console.log('✅ Tender approved successfully:', { tenderId });

    return {
      tenderId,
      action: 'approved',
      status: 'completed',
      message: 'Tender extraction approved and finalized successfully',
    };
  }

  /**
   * Reject a tender extraction
   * @param tenderId Tender ID to reject
   * @param reason Optional rejection reason
   * @param ipAddress Optional IP address for audit logging
   * @param userId Optional user ID for audit logging
   * @returns Review action result
   */
  async rejectTender(
    tenderId: string,
    reason?: string,
    ipAddress?: string,
    userId?: string
  ): Promise<ReviewActionResult> {
    console.log('❌ Rejecting tender:', { tenderId, reason });

    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
    });

    if (!tender) {
      throw new ResourceNotFoundError('Tender', tenderId);
    }

    // Update tender status to rejected
    await prisma.tender.update({
      where: { id: tenderId },
      data: { status: 'rejected' },
    });

    // Log the rejection action
    await this.logReviewAction(tenderId, 'rejected', {
      previousStatus: tender.status,
      reason: reason || 'No reason provided',
    }, ipAddress, userId);

    console.log('❌ Tender rejected:', { tenderId });

    return {
      tenderId,
      action: 'rejected',
      status: 'rejected',
      message: 'Tender extraction rejected',
    };
  }

  /**
   * Update BOQ items for a tender
   * @param tenderId Tender ID
   * @param items Updated BOQ items
   * @param ipAddress Optional IP address for audit logging
   * @param userId Optional user ID for audit logging
   * @returns Updated tender with BOQ items
   */
  async updateBOQItems(
    tenderId: string,
    items: BOQItemUpdate[],
    ipAddress?: string,
    userId?: string
  ) {
    console.log('📝 Updating BOQ items:', { tenderId, itemCount: items.length });

    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: { boqs: true },
    });

    if (!tender) {
      throw new ResourceNotFoundError('Tender', tenderId);
    }

    // Delete existing BOQ items
    await prisma.bOQ.deleteMany({
      where: { tenderId },
    });

    // Create new BOQ items
    const boqItems = items.map((item) => ({
      tenderId,
      itemNumber: item.itemNumber,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitRate: item.unitRate,
      amount: item.amount,
      category: item.category,
    }));

    await prisma.bOQ.createMany({
      data: boqItems,
    });

    // Log the update action
    await this.logReviewAction(tenderId, 'items_updated', {
      previousItemCount: tender.boqs.length,
      newItemCount: items.length,
    }, ipAddress, userId);

    console.log('✅ BOQ items updated:', { tenderId, itemCount: items.length });

    // Return updated tender
    return await this.getTender(tenderId);
  }

  /**
   * Get review logs for a tender
   * @param tenderId Tender ID
   * @returns Array of review log entries
   */
  async getReviewLogs(tenderId: string) {
    return await prisma.reviewLog.findMany({
      where: { tenderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Log a review action for traceability
   * @param tenderId Tender ID
   * @param action Action type
   * @param details Additional details
   * @param ipAddress Optional IP address
   * @param userId Optional user ID
   */
  private async logReviewAction(
    tenderId: string,
    action: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userId?: string
  ) {
    await prisma.reviewLog.create({
      data: {
        tenderId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
        userId: userId || null,
      },
    });

    console.log('📋 Review action logged:', { tenderId, action });
  }

  /**
   * Check if a file is an Excel file based on MIME type
   * @param mimeType MIME type of the file
   * @returns True if file is Excel format
   */
  private isExcelFile(mimeType: string): boolean {
    const excelMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    return excelMimeTypes.includes(mimeType);
  }

  /**
   * Check if a file is a CSV file based on MIME type
   * @param mimeType MIME type of the file
   * @returns True if file is CSV format
   */
  private isCSVFile(mimeType: string): boolean {
    return mimeType === 'text/csv';
  }
}
