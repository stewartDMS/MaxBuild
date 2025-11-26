import { ExcelLoader } from '../ai/loaders/excel.loader';
import { BOQGenerationChain } from '../ai/chains/boq-generation.chain';
import { InvalidStructureError } from '../lib/errors';
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
    console.log('📊 Starting Excel processing...');
    
    // Step 1: Load and parse Excel file
    const excelData = await this.excelLoader.load(filePath);

    // Step 2: Validate structure (optional - provides warnings)
    const validation = this.validateExcelStructure(excelData);
    if (validation.suggestions.length > 0) {
      console.warn('⚠️  Excel structure warnings:', validation.suggestions);
    }

    // Step 3: Convert Excel data to text for AI processing
    console.log('📝 Converting Excel data to text format...');
    const extractedText = this.excelLoader.convertToText(excelData);

    // Step 4: Run BOQ generation chain on the extracted text
    const boqExtraction = await this.boqChain.run(extractedText);

    console.log('✅ Excel processing completed');

    return {
      boqExtraction,
      extractedText,
      excelData,
    };
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
    console.log('📊 Starting Excel buffer processing...');
    
    // Load and parse Excel from buffer
    const excelData = await this.excelLoader.loadFromBuffer(buffer);

    // Validate structure
    const validation = this.validateExcelStructure(excelData);
    if (validation.suggestions.length > 0) {
      console.warn('⚠️  Excel structure warnings:', validation.suggestions);
    }

    // Convert Excel data to text for AI processing
    const extractedText = this.excelLoader.convertToText(excelData);

    // Run BOQ generation chain on the extracted text
    const boqExtraction = await this.boqChain.run(extractedText);

    console.log('✅ Excel buffer processing completed');

    return {
      boqExtraction,
      extractedText,
      excelData,
    };
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
