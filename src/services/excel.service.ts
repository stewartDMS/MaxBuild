import { ExcelLoader } from '../ai/loaders/excel.loader';
import { BOQGenerationChain } from '../ai/chains/boq-generation.chain';
import type { BOQExtraction } from '../ai/schemas/boq.schema';
import type { ExcelData } from '../ai/loaders/excel.loader';

/**
 * Service for handling Excel document processing and BOQ extraction
 */
export class ExcelService {
  private excelLoader: ExcelLoader;
  private boqChain: BOQGenerationChain;

  constructor() {
    this.excelLoader = new ExcelLoader();
    this.boqChain = new BOQGenerationChain();
  }

  /**
   * Process an Excel file and extract BOQ data
   * @param filePath Path to the Excel file
   * @returns BOQ extraction result and raw Excel data
   */
  async processExcel(filePath: string): Promise<{
    boqExtraction: BOQExtraction;
    extractedText: string;
    excelData: ExcelData;
  }> {
    try {
      // Step 1: Load and parse Excel file
      console.log('Loading Excel file...');
      const excelData = await this.excelLoader.load(filePath);

      // Validate that the Excel file is not empty
      if (excelData.sheets.length === 0 || excelData.sheets.every(sheet => sheet.data.length === 0)) {
        throw new Error('Excel file is empty or contains no data');
      }

      // Step 2: Convert Excel data to text for AI processing
      console.log('Converting Excel data to text format...');
      const extractedText = this.excelLoader.convertToText(excelData);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the Excel file');
      }

      // Step 3: Run BOQ generation chain on the extracted text
      console.log('Running BOQ generation chain on Excel data...');
      const boqExtraction = await this.boqChain.run(extractedText);

      return {
        boqExtraction,
        extractedText,
        excelData,
      };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Unsupported file')) {
          throw new Error('The Excel file format is not supported. Please use .xlsx or .xls format.');
        } else if (error.message.includes('encrypted') || error.message.includes('password')) {
          throw new Error('Cannot process password-protected Excel files. Please remove password protection and try again.');
        } else if (error.message.includes('empty')) {
          throw new Error('The Excel file appears to be empty or contains no readable data.');
        }
      }
      
      throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process an Excel file from a buffer
   * @param buffer Excel file buffer
   * @returns BOQ extraction result and raw Excel data
   */
  async processExcelFromBuffer(buffer: Buffer): Promise<{
    boqExtraction: BOQExtraction;
    extractedText: string;
    excelData: ExcelData;
  }> {
    try {
      // Load and parse Excel from buffer
      const excelData = await this.excelLoader.loadFromBuffer(buffer);

      // Validate that the Excel file is not empty
      if (excelData.sheets.length === 0 || excelData.sheets.every(sheet => sheet.data.length === 0)) {
        throw new Error('Excel file is empty or contains no data');
      }

      // Convert Excel data to text for AI processing
      const extractedText = this.excelLoader.convertToText(excelData);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the Excel file');
      }

      // Run BOQ generation chain on the extracted text
      const boqExtraction = await this.boqChain.run(extractedText);

      return {
        boqExtraction,
        extractedText,
        excelData,
      };
    } catch (error) {
      console.error('Error processing Excel buffer:', error);
      throw new Error(`Failed to process Excel buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Excel file structure for BOQ extraction
   * @param excelData Parsed Excel data
   * @returns Validation result with suggestions
   */
  validateExcelStructure(excelData: ExcelData): {
    isValid: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];

    // Check if any sheet has data
    const hasData = excelData.sheets.some(sheet => sheet.data.length > 0);
    if (!hasData) {
      return {
        isValid: false,
        suggestions: ['Excel file contains no data rows'],
      };
    }

    // Look for common BOQ column names
    const commonBOQColumns = [
      'item',
      'description',
      'quantity',
      'unit',
      'rate',
      'amount',
      'no',
      'item number',
      'particulars',
      'qty',
      'uom',
    ];

    let foundBOQColumns = false;
    for (const sheet of excelData.sheets) {
      if (sheet.data.length === 0) continue;

      const headers = Object.keys(sheet.data[0]).map(h => h.toLowerCase());
      const matchedColumns = headers.filter(h =>
        commonBOQColumns.some(boqCol => h.includes(boqCol))
      );

      if (matchedColumns.length >= 2) {
        foundBOQColumns = true;
        break;
      }
    }

    if (!foundBOQColumns) {
      suggestions.push(
        'Excel file may not be a BOQ document. Expected columns like Item, Description, Quantity, Unit, Rate.'
      );
    }

    return {
      isValid: true,
      suggestions,
    };
  }
}
