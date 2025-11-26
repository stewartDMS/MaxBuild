import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

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
      // Read the CSV file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Parse the CSV
      const records = parse(fileContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        cast: false, // Keep all values as strings
      }) as Record<string, string>[];
      
      // Get column count from headers
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      
      return {
        fileName: filePath.split('/').pop() || 'unknown',
        data: records,
        rowCount: records.length + 1, // +1 for header row
        columnCount: headers.length,
      };
    } catch (error) {
      console.error('Error loading CSV:', error);
      throw new Error(`Failed to load CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a CSV file from a buffer and extract its content
   * @param buffer CSV file buffer
   * @returns Extracted data from the CSV file
   */
  async loadFromBuffer(buffer: Buffer): Promise<CSVData> {
    try {
      // Convert buffer to string
      const fileContent = buffer.toString('utf-8');
      
      // Parse the CSV
      const records = parse(fileContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        cast: false, // Keep all values as strings
      }) as Record<string, string>[];
      
      // Get column count from headers
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      
      return {
        fileName: 'buffer',
        data: records,
        rowCount: records.length + 1, // +1 for header row
        columnCount: headers.length,
      };
    } catch (error) {
      console.error('Error loading CSV from buffer:', error);
      throw new Error(`Failed to load CSV from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
