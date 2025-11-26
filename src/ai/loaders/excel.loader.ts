import ExcelJS from 'exceljs';
import {
  CorruptFileError,
  EmptyFileError,
  ParsingError,
  PasswordProtectedFileError,
} from '../../lib/errors';

/**
 * Loads and extracts data from Excel files (.xlsx, .xls)
 * Now using ExcelJS instead of xlsx for better security (no prototype pollution vulnerability)
 */
export class ExcelLoader {
  /**
   * Load an Excel file and extract its content as structured data
   * @param filePath Path to the Excel file
   * @returns Extracted data from the Excel file
   */
  async load(filePath: string): Promise<ExcelData> {
    try {
      console.log('📊 Loading Excel file...');
      
      // Create a new workbook and read the file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      // Extract data from all sheets
      const sheets: SheetData[] = [];
      
      workbook.eachSheet((worksheet) => {
        const sheetData: Record<string, string>[] = [];
        const headers: string[] = [];
        
        // Get the actual dimensions of the worksheet
        const rowCount = worksheet.rowCount;
        const columnCount = worksheet.columnCount;
        
        // First row as headers
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          headers[colNumber] = String(cell.value || `Column${colNumber}`);
        });
        
        // Process data rows (starting from row 2)
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: Record<string, string> = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = headers[colNumber] || `Column${colNumber}`;
            // Convert cell value to string, handling different types
            let value = '';
            if (cell.value !== null && cell.value !== undefined) {
              if (typeof cell.value === 'object' && 'result' in cell.value) {
                // Handle formula cells
                value = String(cell.value.result || '');
              } else if (typeof cell.value === 'object' && 'text' in cell.value) {
                // Handle rich text
                value = String(cell.value.text || '');
              } else {
                value = String(cell.value);
              }
            }
            rowData[header] = value;
          });
          
          // Only add row if it has at least one non-empty value
          if (Object.values(rowData).some(v => v !== '')) {
            sheetData.push(rowData);
          }
        });
        
        sheets.push({
          name: worksheet.name,
          data: sheetData,
          rowCount: rowCount,
          columnCount: columnCount,
        });
      });

      // Validate that we have data
      if (sheets.length === 0 || sheets.every(sheet => sheet.data.length === 0)) {
        throw new EmptyFileError('Excel', 'The Excel file contains no sheets or all sheets are empty');
      }

      console.log('✅ Excel file loaded successfully:', {
        sheets: sheets.length,
        totalRows: sheets.reduce((sum, s) => sum + s.data.length, 0),
      });
      
      return {
        fileName: filePath.split('/').pop() || 'unknown',
        sheetCount: sheets.length,
        sheets,
      };
    } catch (error) {
      console.error('❌ Error loading Excel:', error);
      
      // Handle specific error cases
      if (error instanceof EmptyFileError) {
        throw error;
      }
      
      // Check for common Excel issues
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Password-protected file
        if (errorMessage.includes('password') || 
            errorMessage.includes('encrypted') ||
            errorMessage.includes('protected')) {
          throw new PasswordProtectedFileError('Excel');
        }
        
        // Corrupted file
        if (errorMessage.includes('corrupt') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('malformed') ||
            errorMessage.includes('zip')) {
          throw new CorruptFileError('Excel', 'The Excel file appears to be corrupted or in an invalid format');
        }
        
        // Unsupported format
        if (errorMessage.includes('unsupported')) {
          throw new CorruptFileError('Excel', 'The Excel file format is not supported. Please use .xlsx or .xls');
        }
      }
      
      // Generic parsing error
      throw new ParsingError('Excel', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Load an Excel file from a buffer and extract its content
   * @param buffer Excel file buffer
   * @returns Extracted data from the Excel file
   */
  async loadFromBuffer(buffer: Buffer): Promise<ExcelData> {
    try {
      console.log('📊 Loading Excel from buffer...');
      
      // Create a new workbook and read from buffer
      const workbook = new ExcelJS.Workbook();
      // Convert Buffer to Uint8Array for exceljs compatibility
      const uint8Array = new Uint8Array(buffer);
      await workbook.xlsx.load(uint8Array.buffer);
      
      // Extract data from all sheets
      const sheets: SheetData[] = [];
      
      workbook.eachSheet((worksheet) => {
        const sheetData: Record<string, string>[] = [];
        const headers: string[] = [];
        
        // Get the actual dimensions of the worksheet
        const rowCount = worksheet.rowCount;
        const columnCount = worksheet.columnCount;
        
        // First row as headers
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          headers[colNumber] = String(cell.value || `Column${colNumber}`);
        });
        
        // Process data rows (starting from row 2)
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: Record<string, string> = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = headers[colNumber] || `Column${colNumber}`;
            // Convert cell value to string, handling different types
            let value = '';
            if (cell.value !== null && cell.value !== undefined) {
              if (typeof cell.value === 'object' && 'result' in cell.value) {
                // Handle formula cells
                value = String(cell.value.result || '');
              } else if (typeof cell.value === 'object' && 'text' in cell.value) {
                // Handle rich text
                value = String(cell.value.text || '');
              } else {
                value = String(cell.value);
              }
            }
            rowData[header] = value;
          });
          
          // Only add row if it has at least one non-empty value
          if (Object.values(rowData).some(v => v !== '')) {
            sheetData.push(rowData);
          }
        });
        
        sheets.push({
          name: worksheet.name,
          data: sheetData,
          rowCount: rowCount,
          columnCount: columnCount,
        });
      });

      // Validate that we have data
      if (sheets.length === 0 || sheets.every(sheet => sheet.data.length === 0)) {
        throw new EmptyFileError('Excel', 'The Excel file contains no sheets or all sheets are empty');
      }

      console.log('✅ Excel loaded successfully:', {
        sheets: sheets.length,
        totalRows: sheets.reduce((sum, s) => sum + s.data.length, 0),
      });
      
      return {
        fileName: 'buffer',
        sheetCount: sheets.length,
        sheets,
      };
    } catch (error) {
      console.error('❌ Error loading Excel from buffer:', error);
      
      // Handle specific error cases
      if (error instanceof EmptyFileError || 
          error instanceof PasswordProtectedFileError ||
          error instanceof CorruptFileError) {
        throw error;
      }
      
      // Generic parsing error
      throw new ParsingError('Excel', error instanceof Error ? error.message : 'Unknown error');
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
