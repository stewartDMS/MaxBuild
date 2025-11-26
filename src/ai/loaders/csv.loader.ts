import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import {
  CorruptFileError,
  EmptyFileError,
  ParsingError,
} from '../../lib/errors';

/**
 * Loads and extracts data from CSV files
 * Now using csv-parse instead of xlsx for better performance and security
 */
export class CSVLoader {
  /**
   * Load a CSV file and extract its content as structured data
   * @param filePath Path to the CSV file
   * @returns Extracted data from the CSV file
   */
  async load(filePath: string): Promise<CSVData> {
    try {
      console.log('📊 Loading CSV file...');
      
      // Read the CSV file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Check if file is empty
      if (!fileContent || fileContent.trim().length === 0) {
        throw new EmptyFileError('CSV', 'The CSV file is empty');
      }
      
      // Parse the CSV
      const records = parse(fileContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        cast: false, // Keep all values as strings
        relax_column_count: true, // Allow rows with different column counts
      }) as Record<string, string>[];
      
      // Validate that we got data
      if (records.length === 0) {
        throw new EmptyFileError('CSV', 'No data rows found in the CSV file');
      }
      
      // Get column count from headers
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      
      if (headers.length === 0) {
        throw new EmptyFileError('CSV', 'No columns found in the CSV file');
      }

      console.log('✅ CSV file loaded successfully:', {
        rows: records.length,
        columns: headers.length,
      });
      
      return {
        fileName: filePath.split('/').pop() || 'unknown',
        data: records,
        rowCount: records.length + 1, // +1 for header row
        columnCount: headers.length,
      };
    } catch (error) {
      console.error('❌ Error loading CSV:', error);
      
      // Handle specific error cases
      if (error instanceof EmptyFileError) {
        throw error;
      }
      
      // Check for CSV parsing errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Malformed CSV
        if (errorMessage.includes('invalid') ||
            errorMessage.includes('malformed') ||
            errorMessage.includes('quote') ||
            errorMessage.includes('delimiter')) {
          throw new CorruptFileError('CSV', 'The CSV file appears to be malformed or has invalid formatting');
        }
        
        // Encoding issues
        if (errorMessage.includes('encoding') ||
            errorMessage.includes('utf')) {
          throw new CorruptFileError('CSV', 'The CSV file has encoding issues. Please ensure it uses UTF-8 encoding');
        }
      }
      
      // Generic parsing error
      throw new ParsingError('CSV', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Load a CSV file from a buffer and extract its content
   * @param buffer CSV file buffer
   * @returns Extracted data from the CSV file
   */
  async loadFromBuffer(buffer: Buffer): Promise<CSVData> {
    try {
      console.log('📊 Loading CSV from buffer...');
      
      // Convert buffer to string
      const fileContent = buffer.toString('utf-8');
      
      // Check if file is empty
      if (!fileContent || fileContent.trim().length === 0) {
        throw new EmptyFileError('CSV', 'The CSV file is empty');
      }
      
      // Parse the CSV
      const records = parse(fileContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        cast: false, // Keep all values as strings
        relax_column_count: true, // Allow rows with different column counts
      }) as Record<string, string>[];
      
      // Validate that we got data
      if (records.length === 0) {
        throw new EmptyFileError('CSV', 'No data rows found in the CSV file');
      }
      
      // Get column count from headers
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      
      if (headers.length === 0) {
        throw new EmptyFileError('CSV', 'No columns found in the CSV file');
      }

      console.log('✅ CSV loaded successfully:', {
        rows: records.length,
        columns: headers.length,
      });
      
      return {
        fileName: 'buffer',
        data: records,
        rowCount: records.length + 1, // +1 for header row
        columnCount: headers.length,
      };
    } catch (error) {
      console.error('❌ Error loading CSV from buffer:', error);
      
      // Handle specific error cases
      if (error instanceof EmptyFileError ||
          error instanceof CorruptFileError) {
        throw error;
      }
      
      // Generic parsing error
      throw new ParsingError('CSV', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Convert CSV data to text format for AI processing
   * @param csvData Parsed CSV data
   * @returns Text representation of the CSV data
   */
  convertToText(csvData: CSVData): string {
    let text = '';
    
    text += `\n=== CSV File: ${csvData.fileName} ===\n`;
    text += `Rows: ${csvData.rowCount}, Columns: ${csvData.columnCount}\n\n`;
    
    if (csvData.data.length === 0) {
      text += '(Empty file)\n';
      return text;
    }
    
    // Get headers
    const headers = Object.keys(csvData.data[0]);
    
    // Add header row
    text += headers.join(' | ') + '\n';
    text += headers.map(() => '---').join(' | ') + '\n';
    
    // Add data rows
    for (const row of csvData.data) {
      const values = headers.map(header => row[header] || '');
      text += values.join(' | ') + '\n';
    }
    
    text += '\n';
    
    return text;
  }
}

/**
 * Interface for CSV data structure
 */
export interface CSVData {
  fileName: string;
  data: Record<string, string>[];
  rowCount: number;
  columnCount: number;
}
