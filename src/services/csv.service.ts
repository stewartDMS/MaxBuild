import { CSVLoader } from '../ai/loaders/csv.loader';
import { BOQGenerationChain } from '../ai/chains/boq-generation.chain';
import type { BOQExtraction } from '../ai/schemas/boq.schema';
import type { CSVData } from '../ai/loaders/csv.loader';

/**
 * Service for handling CSV document processing and BOQ extraction
 */
export class CSVService {
  private csvLoader: CSVLoader;
  private boqChain: BOQGenerationChain;

  constructor() {
    this.csvLoader = new CSVLoader();
    this.boqChain = new BOQGenerationChain();
  }

  /**
   * Process a CSV file and extract BOQ data
   * @param filePath Path to the CSV file
   * @returns BOQ extraction result and raw CSV data
   */
  async processCSV(filePath: string): Promise<{
    boqExtraction: BOQExtraction;
    extractedText: string;
    csvData: CSVData;
  }> {
    console.log('📊 Starting CSV processing...');
    
    // Step 1: Load and parse CSV file
    const csvData = await this.csvLoader.load(filePath);

    // Step 2: Validate structure (optional - provides warnings)
    const validation = this.validateCSVStructure(csvData);
    if (validation.suggestions.length > 0) {
      console.warn('⚠️  CSV structure warnings:', validation.suggestions);
    }

    // Step 3: Convert CSV data to text for AI processing
    console.log('📝 Converting CSV data to text format...');
    const extractedText = this.csvLoader.convertToText(csvData);

    // Step 4: Run BOQ generation chain on the extracted text
    const boqExtraction = await this.boqChain.run(extractedText);

    console.log('✅ CSV processing completed');

    return {
      boqExtraction,
      extractedText,
      csvData,
    };
  }

  /**
   * Process a CSV file from a buffer
   * @param buffer CSV file buffer
   * @returns BOQ extraction result and raw CSV data
   */
  async processCSVFromBuffer(buffer: Buffer): Promise<{
    boqExtraction: BOQExtraction;
    extractedText: string;
    csvData: CSVData;
  }> {
    console.log('📊 Starting CSV buffer processing...');
    
    // Load and parse CSV from buffer
    const csvData = await this.csvLoader.loadFromBuffer(buffer);

    // Validate structure
    const validation = this.validateCSVStructure(csvData);
    if (validation.suggestions.length > 0) {
      console.warn('⚠️  CSV structure warnings:', validation.suggestions);
    }

    // Convert CSV data to text for AI processing
    const extractedText = this.csvLoader.convertToText(csvData);

    // Run BOQ generation chain on the extracted text
    const boqExtraction = await this.boqChain.run(extractedText);

    console.log('✅ CSV buffer processing completed');

    return {
      boqExtraction,
      extractedText,
      csvData,
    };
  }

  /**
   * Validate CSV file structure for BOQ extraction
   * @param csvData Parsed CSV data
   * @returns Validation result with suggestions
   */
  validateCSVStructure(csvData: CSVData): {
    isValid: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];

    // Check if CSV has data
    if (csvData.data.length === 0) {
      return {
        isValid: false,
        suggestions: ['CSV file contains no data rows'],
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

    const headers = Object.keys(csvData.data[0]).map(h => h.toLowerCase());
    const matchedColumns = headers.filter(h =>
      commonBOQColumns.some(boqCol => h.includes(boqCol))
    );

    if (matchedColumns.length < 2) {
      suggestions.push(
        'CSV file may not be a BOQ document. Expected columns like Item, Description, Quantity, Unit, Rate.'
      );
    }

    return {
      isValid: true,
      suggestions,
    };
  }
}
