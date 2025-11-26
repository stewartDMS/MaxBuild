import ExcelJS from 'exceljs';

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
      
      return {
        fileName: filePath.split('/').pop() || 'unknown',
        sheetCount: sheets.length,
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
      
      return {
        fileName: 'buffer',
        sheetCount: sheets.length,
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
