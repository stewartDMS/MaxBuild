import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { BOQExtractionSchema, type BOQExtraction } from '../schemas/boq.schema';
import { AIExtractionError } from '../../lib/errors';

/**
 * BOQ Generation Chain
 * Extracts Bill of Quantities from tender document text using OpenAI with structured output
 */
export class BOQGenerationChain {
  private model: ChatOpenAI;
  private prompt: PromptTemplate;

  constructor(apiKey?: string) {
    // Initialize the OpenAI model with structured output
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    // Create the prompt template
    this.prompt = PromptTemplate.fromTemplate(`
You are an expert construction estimator and quantity surveyor. Your task is to analyze tender documents and extract Bill of Quantities (BOQ) information.

Given the following tender document text, extract all BOQ items with their details:

Tender Document Text:
{tenderText}

Please extract:
1. All work items with their item numbers
2. Detailed descriptions of each item
3. Quantities and units of measurement
4. Any rates or amounts mentioned
5. Categories or trades (civil, electrical, plumbing, etc.)
6. Project information if available

Today's date: {date}

Provide a comprehensive BOQ extraction following the required schema.
    `);
  }

  /**
   * Run the BOQ generation chain on tender document text
   * @param tenderText Extracted text from the tender document
   * @returns Structured BOQ extraction result
   */
  async run(tenderText: string): Promise<BOQExtraction> {
    try {
      console.log('🤖 Running AI BOQ extraction...');
      console.log('📝 Text length:', tenderText.length, 'characters');
      
      // Create the structured output model
      const structuredModel = this.model.withStructuredOutput(BOQExtractionSchema);

      // Format the prompt
      const formattedPrompt = await this.prompt.format({
        tenderText,
        date: new Date().toISOString(),
      });

      // Invoke the model with structured output
      const result = await structuredModel.invoke(formattedPrompt);

      console.log('✅ AI extraction completed:', {
        itemsExtracted: (result as BOQExtraction).items?.length || 0,
        projectName: (result as BOQExtraction).projectName || 'N/A',
      });

      return result as BOQExtraction;
    } catch (error) {
      console.error('❌ Error in BOQ generation chain:', error);
      
      // Handle specific AI errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // API key issues
        if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
          throw new AIExtractionError(
            'OpenAI API authentication failed',
            {
              reason: 'Invalid or missing API key',
              suggestion: 'Please check your OPENAI_API_KEY environment variable',
            }
          );
        }
        
        // Rate limiting
        if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          throw new AIExtractionError(
            'OpenAI API rate limit exceeded',
            {
              reason: 'Too many requests or quota exceeded',
              suggestion: 'Please wait a moment and try again, or check your OpenAI account usage',
            }
          );
        }
        
        // Network errors
        if (errorMessage.includes('network') || 
            errorMessage.includes('timeout') ||
            errorMessage.includes('econnrefused')) {
          throw new AIExtractionError(
            'Network error connecting to OpenAI API',
            {
              reason: 'Unable to reach the AI service',
              suggestion: 'Please check your internet connection and try again',
            }
          );
        }
        
        // Model/parsing errors
        if (errorMessage.includes('parse') || errorMessage.includes('schema')) {
          throw new AIExtractionError(
            'AI model returned invalid response',
            {
              reason: 'The AI response could not be parsed',
              suggestion: 'The document structure may be too complex. Please try a simpler document',
            }
          );
        }
      }
      
      // Generic AI error
      throw new AIExtractionError(
        'Failed to extract BOQ using AI',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Please try again or contact support if the problem persists',
        }
      );
    }
  }

  /**
   * Run the chain with streaming (for future use)
   * @param tenderText Extracted text from the tender document
   */
  async *stream(tenderText: string) {
    const formattedPrompt = await this.prompt.format({
      tenderText,
      date: new Date().toISOString(),
    });

    const stream = await this.model.stream(formattedPrompt);
    
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
