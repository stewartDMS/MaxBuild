import prisma from '../lib/prisma';
import { PDFLoader } from '../ai/loaders/pdf.loader';
import { BOQGenerationChain } from '../ai/chains/boq-generation.chain';
import type { BOQExtraction } from '../ai/schemas/boq.schema';

export interface TenderUploadResult {
  tenderId: string;
  fileName: string;
  status: string;
  boqExtraction: BOQExtraction;
  itemCount: number;
}

/**
 * Service for handling tender document processing
 */
export class TenderService {
  private pdfLoader: PDFLoader;
  private boqChain: BOQGenerationChain;

  constructor() {
    this.pdfLoader = new PDFLoader();
    this.boqChain = new BOQGenerationChain();
  }

  /**
   * Process an uploaded tender PDF
   * @param filePath Path to the uploaded PDF file
   * @param fileName Original file name
   * @param fileSize File size in bytes
   * @param mimeType MIME type of the file
   * @returns Processing result with BOQ extraction
   */
  async processTender(
    filePath: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<TenderUploadResult> {
    try {
      // Step 1: Extract text from PDF
      console.log('Extracting text from PDF...');
      const extractedText = await this.pdfLoader.load(filePath);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      // Step 2: Create tender record in database
      console.log('Creating tender record...');
      const tender = await prisma.tender.create({
        data: {
          fileName,
          fileSize,
          mimeType,
          extractedText,
          status: 'processing',
        },
      });

      // Step 3: Run BOQ generation chain
      console.log('Running BOQ generation chain...');
      const boqExtraction = await this.boqChain.run(extractedText);

      // Step 4: Save BOQ items to database
      console.log('Saving BOQ items...');
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

      // Step 5: Update tender status
      await prisma.tender.update({
        where: { id: tender.id },
        data: { status: 'completed' },
      });

      return {
        tenderId: tender.id,
        fileName,
        status: 'completed',
        boqExtraction,
        itemCount: boqItems.length,
      };
    } catch (error) {
      console.error('Error processing tender:', error);
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
}
