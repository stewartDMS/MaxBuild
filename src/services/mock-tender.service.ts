/**
 * Mock Tender Service
 * 
 * This service simulates the end-to-end tender processing flow for demonstration
 * and team alignment purposes. It does NOT require a live backend, database, or AI service.
 * 
 * The flow demonstrates:
 * 1. File Upload - Receiving and validating uploaded files
 * 2. File Parsing/Reading - Extracting content from the uploaded document
 * 3. Mock Analysis - Simulating AI-powered BOQ extraction
 * 4. Document Generation - Creating the result document
 * 5. Result Sending - Returning the processed data
 */

export interface MockBOQItem {
  itemNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
  category?: string;
}

export interface MockBOQExtraction {
  projectName: string;
  projectLocation?: string;
  items: MockBOQItem[];
  totalEstimatedCost: number;
  currency: string;
  extractionDate: string;
  notes?: string;
}

export interface MockTenderResult {
  tenderId: string;
  fileName: string;
  status: string;
  boqExtraction: MockBOQExtraction;
  itemCount: number;
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  phase: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
  details: string;
  durationMs?: number;
}

/**
 * Generate a unique mock ID for demonstration purposes
 */
function generateMockId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Simulate processing delay for realistic demo experience
 */
async function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock Tender Service for demonstration purposes
 * 
 * This service provides a complete end-to-end mock flow without requiring:
 * - PostgreSQL database
 * - OpenAI API key
 * - LangGraph API key
 * - Any external services
 */
export class MockTenderService {
  /**
   * Process a mock tender upload - demonstrates the complete flow
   * 
   * @param fileBuffer Optional file buffer (if provided, will extract some info)
   * @param fileName Original file name
   * @param fileSize File size in bytes
   * @param mimeType MIME type of the file
   * @param context Optional extraction context
   * @returns Mock processing result with detailed step information
   */
  async processMockTender(
    fileBuffer: Buffer | null,
    fileName: string,
    fileSize: number,
    mimeType: string,
    context?: string
  ): Promise<MockTenderResult> {
    const startTime = Date.now();
    const processingSteps: ProcessingStep[] = [];
    const mockId = generateMockId();

    // =====================================================
    // PHASE 1: FILE UPLOAD RECEIVED
    // =====================================================
    console.log('\n========================================');
    console.log('📤 PHASE 1: FILE UPLOAD RECEIVED');
    console.log('========================================');
    console.log('📋 File Details:');
    console.log(`   - File Name: ${fileName}`);
    console.log(`   - File Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   - MIME Type: ${mimeType}`);
    console.log(`   - Has Context: ${!!context}`);
    if (context) {
      console.log(`   - Context: "${context}"`);
    }
    console.log(`   - Mock Tender ID: ${mockId}`);

    processingSteps.push({
      phase: 'FILE_UPLOAD',
      status: 'completed',
      timestamp: new Date().toISOString(),
      details: `File "${fileName}" (${(fileSize / 1024).toFixed(2)} KB) received successfully`,
      durationMs: 0,
    });

    // Simulate upload processing time
    await simulateDelay(100);

    // =====================================================
    // PHASE 2: FILE PARSING/READING
    // =====================================================
    const parseStart = Date.now();
    console.log('\n========================================');
    console.log('📖 PHASE 2: FILE PARSING/READING');
    console.log('========================================');
    console.log('🔍 Parsing file content...');

    // Simulate parsing based on file type
    let extractedTextPreview = '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
      console.log('   - Detected: PDF Document');
      console.log('   - Action: Extracting text from PDF pages...');
      extractedTextPreview = this.generateMockPDFContent(fileName);
    } else if (mimeType.includes('spreadsheet') || fileExtension === 'xlsx' || fileExtension === 'xls') {
      console.log('   - Detected: Excel Spreadsheet');
      console.log('   - Action: Reading worksheet data...');
      extractedTextPreview = this.generateMockExcelContent(fileName);
    } else if (mimeType === 'text/csv' || fileExtension === 'csv') {
      console.log('   - Detected: CSV File');
      console.log('   - Action: Parsing CSV rows...');
      extractedTextPreview = this.generateMockCSVContent(fileName);
    } else {
      console.log('   - Detected: Unknown file type (treating as text)');
      extractedTextPreview = this.generateMockGenericContent(fileName);
    }

    // If we have actual file content, show a preview
    if (fileBuffer && fileBuffer.length > 0) {
      console.log(`   - Actual file buffer size: ${fileBuffer.length} bytes`);
      // For text-based files, try to show first few characters
      if (mimeType === 'text/csv' || mimeType.includes('text')) {
        const textPreview = fileBuffer.toString('utf8').substring(0, 200);
        console.log(`   - Content preview: "${textPreview}..."`);
      }
    }

    console.log(`   - Extracted text length: ${extractedTextPreview.length} characters`);
    console.log('✅ File parsing completed successfully');

    const parseDuration = Date.now() - parseStart;
    processingSteps.push({
      phase: 'FILE_PARSING',
      status: 'completed',
      timestamp: new Date().toISOString(),
      details: `Extracted ${extractedTextPreview.length} characters from ${fileExtension.toUpperCase() || 'document'}`,
      durationMs: parseDuration,
    });

    await simulateDelay(150);

    // =====================================================
    // PHASE 3: MOCK AI ANALYSIS
    // =====================================================
    const analysisStart = Date.now();
    console.log('\n========================================');
    console.log('🤖 PHASE 3: MOCK AI ANALYSIS');
    console.log('========================================');
    console.log('🧠 Simulating AI-powered BOQ extraction...');
    console.log('   - Model: Mock-GPT-Demo (simulated)');
    console.log('   - Task: Bill of Quantities extraction');
    if (context) {
      console.log(`   - Custom Context Applied: "${context}"`);
    }

    // Generate mock BOQ items based on context or defaults
    const mockItems = this.generateMockBOQItems(context);
    console.log(`   - Items identified: ${mockItems.length}`);
    console.log('   - Categories found: Foundation, Structural, Electrical, Plumbing');

    const totalCost = mockItems.reduce((sum, item) => sum + item.amount, 0);
    console.log(`   - Total estimated cost: $${totalCost.toLocaleString()}`);
    console.log('✅ AI analysis completed successfully');

    const analysisDuration = Date.now() - analysisStart;
    processingSteps.push({
      phase: 'AI_ANALYSIS',
      status: 'completed',
      timestamp: new Date().toISOString(),
      details: `Extracted ${mockItems.length} BOQ items with total cost $${totalCost.toLocaleString()}`,
      durationMs: analysisDuration,
    });

    await simulateDelay(200);

    // =====================================================
    // PHASE 4: DOCUMENT GENERATION
    // =====================================================
    const generationStart = Date.now();
    console.log('\n========================================');
    console.log('📄 PHASE 4: DOCUMENT GENERATION');
    console.log('========================================');
    console.log('🔧 Generating structured BOQ output...');

    const boqExtraction: MockBOQExtraction = {
      projectName: this.extractProjectName(fileName),
      projectLocation: 'Demo Location - City Center',
      items: mockItems,
      totalEstimatedCost: totalCost,
      currency: 'USD',
      extractionDate: new Date().toISOString(),
      notes: context
        ? `Extraction guided by context: "${context}"`
        : 'Standard extraction without custom context',
    };

    console.log('   - Project Name:', boqExtraction.projectName);
    console.log('   - Location:', boqExtraction.projectLocation);
    console.log('   - Total Items:', boqExtraction.items.length);
    console.log('   - Currency:', boqExtraction.currency);
    console.log('✅ Document generation completed');

    const generationDuration = Date.now() - generationStart;
    processingSteps.push({
      phase: 'DOCUMENT_GENERATION',
      status: 'completed',
      timestamp: new Date().toISOString(),
      details: `Generated BOQ document for project "${boqExtraction.projectName}"`,
      durationMs: generationDuration,
    });

    await simulateDelay(50);

    // =====================================================
    // PHASE 5: RESULT PREPARATION & SENDING
    // =====================================================
    console.log('\n========================================');
    console.log('📤 PHASE 5: RESULT PREPARATION & SENDING');
    console.log('========================================');
    console.log('📦 Preparing final response...');

    const totalDuration = Date.now() - startTime;
    processingSteps.push({
      phase: 'RESULT_SENDING',
      status: 'completed',
      timestamp: new Date().toISOString(),
      details: `Response prepared and ready to send`,
      durationMs: totalDuration,
    });

    const result: MockTenderResult = {
      tenderId: mockId,
      fileName,
      status: 'mock_completed',
      boqExtraction,
      itemCount: mockItems.length,
      processingSteps,
    };

    console.log('   - Tender ID:', result.tenderId);
    console.log('   - Status:', result.status);
    console.log('   - Item Count:', result.itemCount);
    console.log(`   - Total Processing Time: ${totalDuration}ms`);
    console.log('✅ MOCK TENDER PROCESSING COMPLETE');
    console.log('========================================\n');

    return result;
  }

  /**
   * Generate mock PDF content for demonstration
   */
  private generateMockPDFContent(fileName: string): string {
    return `
[Mock PDF Content for "${fileName}"]
=====================================
TENDER DOCUMENT
Project: ${this.extractProjectName(fileName)}
Date: ${new Date().toLocaleDateString()}

BILL OF QUANTITIES

Section A: Foundation Works
1. Excavation of foundation - 500 m³
2. Concrete foundation - 200 m³
3. Steel reinforcement - 5000 kg

Section B: Structural Works  
4. Concrete columns - 100 m³
5. Steel beams - 8000 kg
6. Concrete slabs - 300 m³

Section C: Electrical Works
7. Main electrical panel - 1 unit
8. Wiring and conduits - 2000 m
9. Light fixtures - 150 units

Section D: Plumbing Works
10. Water supply pipes - 500 m
11. Drainage system - 400 m
12. Sanitary fixtures - 25 units
=====================================
    `.trim();
  }

  /**
   * Generate mock Excel content for demonstration
   */
  private generateMockExcelContent(fileName: string): string {
    return `
[Mock Excel Content for "${fileName}"]
Sheet: BOQ Summary
Row 1: Item | Description | Qty | Unit | Rate | Amount
Row 2: 1 | Excavation work | 500 | m³ | 25 | 12500
Row 3: 2 | Concrete works | 200 | m³ | 150 | 30000
Row 4: 3 | Steel reinforcement | 5000 | kg | 3 | 15000
Row 5: 4 | Electrical installation | 1 | lot | 50000 | 50000
Row 6: 5 | Plumbing works | 1 | lot | 35000 | 35000
    `.trim();
  }

  /**
   * Generate mock CSV content for demonstration
   */
  private generateMockCSVContent(fileName: string): string {
    return `
[Mock CSV Content for "${fileName}"]
Item,Description,Quantity,Unit,Rate,Amount
1,Site preparation,1,lot,5000,5000
2,Foundation excavation,500,m3,25,12500
3,Concrete foundation,200,m3,150,30000
4,Steel reinforcement,5000,kg,3,15000
5,Masonry work,1000,m2,45,45000
    `.trim();
  }

  /**
   * Generate mock generic content for demonstration
   */
  private generateMockGenericContent(fileName: string): string {
    return `[Mock Content for "${fileName}"] - Generic tender document content`;
  }

  /**
   * Generate mock BOQ items based on context
   */
  private generateMockBOQItems(context?: string): MockBOQItem[] {
    // Base items that are always included
    const baseItems: MockBOQItem[] = [
      {
        itemNumber: '1.0',
        description: 'Site Preparation and Clearing',
        quantity: 1,
        unit: 'lot',
        unitRate: 15000,
        amount: 15000,
        category: 'Preliminary',
      },
      {
        itemNumber: '2.1',
        description: 'Excavation of foundation trenches',
        quantity: 450,
        unit: 'm³',
        unitRate: 28,
        amount: 12600,
        category: 'Foundation',
      },
      {
        itemNumber: '2.2',
        description: 'Concrete foundation (Grade C25)',
        quantity: 180,
        unit: 'm³',
        unitRate: 165,
        amount: 29700,
        category: 'Foundation',
      },
      {
        itemNumber: '3.1',
        description: 'Reinforced concrete columns',
        quantity: 85,
        unit: 'm³',
        unitRate: 220,
        amount: 18700,
        category: 'Structural',
      },
      {
        itemNumber: '3.2',
        description: 'Structural steel beams (Grade S355)',
        quantity: 6500,
        unit: 'kg',
        unitRate: 4.5,
        amount: 29250,
        category: 'Structural',
      },
    ];

    // If context mentions electrical, add more electrical items
    if (context?.toLowerCase().includes('electrical')) {
      baseItems.push(
        {
          itemNumber: '4.1',
          description: 'Main Distribution Board (MDB)',
          quantity: 2,
          unit: 'unit',
          unitRate: 8500,
          amount: 17000,
          category: 'Electrical',
        },
        {
          itemNumber: '4.2',
          description: 'Copper wiring (2.5mm²)',
          quantity: 3500,
          unit: 'm',
          unitRate: 3.2,
          amount: 11200,
          category: 'Electrical',
        },
        {
          itemNumber: '4.3',
          description: 'LED Light fixtures',
          quantity: 180,
          unit: 'unit',
          unitRate: 85,
          amount: 15300,
          category: 'Electrical',
        }
      );
    } else {
      // Default electrical items
      baseItems.push({
        itemNumber: '4.1',
        description: 'Electrical installation (complete)',
        quantity: 1,
        unit: 'lot',
        unitRate: 45000,
        amount: 45000,
        category: 'Electrical',
      });
    }

    // If context mentions plumbing, add more plumbing items
    if (context?.toLowerCase().includes('plumbing')) {
      baseItems.push(
        {
          itemNumber: '5.1',
          description: 'PPR Water supply pipes (25mm)',
          quantity: 650,
          unit: 'm',
          unitRate: 12,
          amount: 7800,
          category: 'Plumbing',
        },
        {
          itemNumber: '5.2',
          description: 'PVC Drainage pipes (110mm)',
          quantity: 420,
          unit: 'm',
          unitRate: 18,
          amount: 7560,
          category: 'Plumbing',
        },
        {
          itemNumber: '5.3',
          description: 'Sanitary fixtures (complete set)',
          quantity: 28,
          unit: 'set',
          unitRate: 450,
          amount: 12600,
          category: 'Plumbing',
        }
      );
    } else {
      // Default plumbing item
      baseItems.push({
        itemNumber: '5.1',
        description: 'Plumbing installation (complete)',
        quantity: 1,
        unit: 'lot',
        unitRate: 38000,
        amount: 38000,
        category: 'Plumbing',
      });
    }

    // Add finishing items
    baseItems.push(
      {
        itemNumber: '6.1',
        description: 'Internal plastering',
        quantity: 1200,
        unit: 'm²',
        unitRate: 15,
        amount: 18000,
        category: 'Finishing',
      },
      {
        itemNumber: '6.2',
        description: 'External painting (weather-resistant)',
        quantity: 800,
        unit: 'm²',
        unitRate: 22,
        amount: 17600,
        category: 'Finishing',
      }
    );

    return baseItems;
  }

  /**
   * Extract a project name from the file name
   */
  private extractProjectName(fileName: string): string {
    // Remove extension and clean up the name
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // Convert dashes/underscores to spaces and title case
    const cleanName = nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return cleanName || 'Demo Construction Project';
  }
}
