import fs from 'fs/promises';
import * as XLSX from 'xlsx';

/**
 * Loads and extracts data from CSV files
 */
export class CSVLoader {
  /**
   * Load a CSV file and extract its content as structured data
   * @param filePath Path to the CSV file
   * @returns Extracted data from the CSV file
   */
  async load(filePath: string): Promise<CSVData> {
    try {
      // Read the CSV file as a buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse the CSV using xlsx library (which supports CSV)
      const workbook = XLSX.read(dataBuffer, { type: 'buffer' });
      
      // Get the first (and typically only) sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false, // Keep values as strings for consistency
      });
      
      // Get the range of the sheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      return {
        fileName: filePath.split('/').pop() || 'unknown',
        data: jsonData as Record<string, string>[],
        rowCount: range.e.r - range.s.r + 1,
        columnCount: range.e.c - range.s.c + 1,
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
      // Parse the CSV using xlsx library
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Get the first (and typically only) sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false, // Keep values as strings for consistency
      });
      
      // Get the range of the sheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      return {
        fileName: 'buffer',
        data: jsonData as Record<string, string>[],
        rowCount: range.e.r - range.s.r + 1,
        columnCount: range.e.c - range.s.c + 1,
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
