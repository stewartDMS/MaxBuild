import fs from 'fs/promises';
import * as XLSX from 'xlsx';

/**
 * Loads and extracts data from Excel files (.xlsx, .xls)
 */
export class ExcelLoader {
  /**
   * Load an Excel file and extract its content as structured data
   * @param filePath Path to the Excel file
   * @returns Extracted data from the Excel file
   */
  async load(filePath: string): Promise<ExcelData> {
    try {
      // Read the Excel file as a buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse the workbook
      const workbook = XLSX.read(dataBuffer, { type: 'buffer' });
      
      // Extract data from all sheets
      const sheets: SheetData[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false, // Keep values as strings for consistency
        });
        
        // Get the range of the sheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        sheets.push({
          name: sheetName,
          data: jsonData as Record<string, string>[],
          rowCount: range.e.r - range.s.r + 1,
          columnCount: range.e.c - range.s.c + 1,
        });
      }
      
      return {
        fileName: filePath.split('/').pop() || 'unknown',
        sheetCount: workbook.SheetNames.length,
        sheets,
      };
    } catch (error) {
      console.error('Error loading Excel:', error);
      throw new Error(`Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load an Excel file from a buffer and extract its content
   * @param buffer Excel file buffer
   * @returns Extracted data from the Excel file
   */
  async loadFromBuffer(buffer: Buffer): Promise<ExcelData> {
    try {
      // Parse the workbook
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Extract data from all sheets
      const sheets: SheetData[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false, // Keep values as strings for consistency
        });
        
        // Get the range of the sheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        sheets.push({
          name: sheetName,
          data: jsonData as Record<string, string>[],
          rowCount: range.e.r - range.s.r + 1,
          columnCount: range.e.c - range.s.c + 1,
        });
      }
      
      return {
        fileName: 'buffer',
        sheetCount: workbook.SheetNames.length,
        sheets,
      };
    } catch (error) {
      console.error('Error loading Excel from buffer:', error);
      throw new Error(`Failed to load Excel from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Excel data to text format for AI processing
   * @param excelData Parsed Excel data
   * @returns Text representation of the Excel data
   */
  convertToText(excelData: ExcelData): string {
    let text = '';
    
    for (const sheet of excelData.sheets) {
      text += `\n=== Sheet: ${sheet.name} ===\n`;
      text += `Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}\n\n`;
      
      if (sheet.data.length === 0) {
        text += '(Empty sheet)\n';
        continue;
      }
      
      // Get headers
      const headers = Object.keys(sheet.data[0]);
      
      // Add header row
      text += headers.join(' | ') + '\n';
      text += headers.map(() => '---').join(' | ') + '\n';
      
      // Add data rows
      for (const row of sheet.data) {
        const values = headers.map(header => row[header] || '');
        text += values.join(' | ') + '\n';
      }
      
      text += '\n';
    }
    
    return text;
  }
}

/**
 * Interface for Excel data structure
 */
export interface ExcelData {
  fileName: string;
  sheetCount: number;
  sheets: SheetData[];
}

/**
 * Interface for individual sheet data
 */
export interface SheetData {
  name: string;
  data: Record<string, string>[];
  rowCount: number;
  columnCount: number;
}
