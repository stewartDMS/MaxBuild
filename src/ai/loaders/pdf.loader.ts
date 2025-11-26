import fs from 'fs/promises';
import { CorruptFileError, EmptyFileError, ParsingError } from '../../lib/errors';

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
      console.log('📄 Loading PDF file...');
      
      // Read the PDF file as a buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse the PDF
      const data = await pdfParse(dataBuffer);
      
      // Validate that we got some text
      if (!data.text || data.text.trim().length === 0) {
        throw new EmptyFileError('PDF', 'No text could be extracted from the PDF');
      }

      console.log('✅ PDF loaded successfully:', {
        pages: data.numpages,
        textLength: data.text.length,
      });
      
      // Return the extracted text
      return data.text;
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      
      // Handle specific error cases
      if (error instanceof EmptyFileError) {
        throw error;
      }
      
      // Check for common PDF issues
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Corrupted or invalid PDF
        if (errorMessage.includes('invalid pdf') || 
            errorMessage.includes('corrupt') ||
            errorMessage.includes('damaged')) {
          throw new CorruptFileError('PDF', 'The PDF file appears to be corrupted or damaged');
        }
        
        // Encrypted/password-protected PDF
        if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
          throw new CorruptFileError('PDF', 'The PDF file is encrypted or password-protected');
        }
      }
      
      // Generic parsing error
      throw new ParsingError('PDF', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Load a PDF from a buffer and extract its text content
   * @param buffer PDF file buffer
   * @returns Extracted text content from the PDF
   */
  async loadFromBuffer(buffer: Buffer): Promise<string> {
    try {
      console.log('📄 Loading PDF from buffer...');
      
      // Parse the PDF
      const data = await pdfParse(buffer);
      
      // Validate that we got some text
      if (!data.text || data.text.trim().length === 0) {
        throw new EmptyFileError('PDF', 'No text could be extracted from the PDF');
      }

      console.log('✅ PDF loaded successfully:', {
        pages: data.numpages,
        textLength: data.text.length,
      });
      
      // Return the extracted text
      return data.text;
    } catch (error) {
      console.error('❌ Error loading PDF from buffer:', error);
      
      // Handle specific error cases
      if (error instanceof EmptyFileError) {
        throw error;
      }
      
      // Generic parsing error
      throw new ParsingError('PDF', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
