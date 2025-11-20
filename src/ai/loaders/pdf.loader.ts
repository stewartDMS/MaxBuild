import fs from 'fs/promises';

// Using require for pdf-parse due to module compatibility
const pdfParse = require('pdf-parse');

/**
 * Loads and extracts text from a PDF file
 */
export class PDFLoader {
  /**
   * Load a PDF file and extract its text content
   * @param filePath Path to the PDF file
   * @returns Extracted text content from the PDF
   */
  async load(filePath: string): Promise<string> {
    try {
      // Read the PDF file as a buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse the PDF
      const data = await pdfParse(dataBuffer);
      
      // Return the extracted text
      return data.text;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a PDF from a buffer and extract its text content
   * @param buffer PDF file buffer
   * @returns Extracted text content from the PDF
   */
  async loadFromBuffer(buffer: Buffer): Promise<string> {
    try {
      // Parse the PDF
      const data = await pdfParse(buffer);
      
      // Return the extracted text
      return data.text;
    } catch (error) {
      console.error('Error loading PDF from buffer:', error);
      throw new Error(`Failed to load PDF from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
