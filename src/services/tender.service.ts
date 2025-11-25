import prisma from '../lib/prisma';
import { PDFLoader } from '../ai/loaders/pdf.loader';
import { BOQGenerationChain } from '../ai/chains/boq-generation.chain';
import { ExcelService } from './excel.service';
import { CSVService } from './csv.service';
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
   * @returns Processing result with BOQ extraction
   */
  async processTender(
    filePath: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<TenderUploadResult> {
    try {
      let extractedText: string;
      let boqExtraction: BOQExtraction;

      // Detect file type and dispatch to appropriate parser
      const isExcel = this.isExcelFile(mimeType);
      const isCSV = this.isCSVFile(mimeType);
      const isPDF = mimeType === 'application/pdf';

      if (isCSV) {
        // Process CSV file
        console.log('Processing CSV file...');
        const result = await this.csvService.processCSV(filePath);
        extractedText = result.extractedText;
        boqExtraction = result.boqExtraction;
      } else if (isExcel) {
        // Process Excel file
        console.log('Processing Excel file...');
        const result = await this.excelService.processExcel(filePath);
        extractedText = result.extractedText;
        boqExtraction = result.boqExtraction;
      } else if (isPDF) {
        // Process PDF file
        console.log('Extracting text from PDF...');
        extractedText = await this.pdfLoader.load(filePath);

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('No text could be extracted from the PDF');
        }

        // Run BOQ generation chain
        console.log('Running BOQ generation chain...');
        boqExtraction = await this.boqChain.run(extractedText);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Create tender record in database
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

      // Save BOQ items to database
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

      // Update tender status
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
