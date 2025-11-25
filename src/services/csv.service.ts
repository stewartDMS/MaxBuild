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
    try {
      // Step 1: Load and parse CSV file
      console.log('Loading CSV file...');
      const csvData = await this.csvLoader.load(filePath);

      // Validate that the CSV file is not empty
      if (csvData.data.length === 0) {
        throw new Error('CSV file is empty or contains no data');
      }

      // Step 2: Convert CSV data to text for AI processing
      console.log('Converting CSV data to text format...');
      const extractedText = this.csvLoader.convertToText(csvData);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the CSV file');
      }

      // Step 3: Run BOQ generation chain on the extracted text
      console.log('Running BOQ generation chain on CSV data...');
      const boqExtraction = await this.boqChain.run(extractedText);

      return {
        boqExtraction,
        extractedText,
        csvData,
      };
    } catch (error) {
      console.error('Error processing CSV file:', error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Unsupported file')) {
          throw new Error('The CSV file format is not supported. Please use standard CSV format.');
        } else if (error.message.includes('empty')) {
          throw new Error('The CSV file appears to be empty or contains no readable data.');
        } else if (error.message.includes('malformed')) {
          throw new Error('The CSV file appears to be malformed. Please check the file structure.');
        }
      }
      
      throw new Error(`Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    try {
      // Load and parse CSV from buffer
      const csvData = await this.csvLoader.loadFromBuffer(buffer);

      // Validate that the CSV file is not empty
      if (csvData.data.length === 0) {
        throw new Error('CSV file is empty or contains no data');
      }

      // Convert CSV data to text for AI processing
      const extractedText = this.csvLoader.convertToText(csvData);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the CSV file');
      }

      // Run BOQ generation chain on the extracted text
      const boqExtraction = await this.boqChain.run(extractedText);

      return {
        boqExtraction,
        extractedText,
        csvData,
      };
    } catch (error) {
      console.error('Error processing CSV buffer:', error);
      throw new Error(`Failed to process CSV buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
