import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { BOQExtractionSchema, type BOQExtraction } from '../schemas/boq.schema';

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
      // Create the structured output model
      const structuredModel = this.model.withStructuredOutput(BOQExtractionSchema);

      // Format the prompt
      const formattedPrompt = await this.prompt.format({
        tenderText,
        date: new Date().toISOString(),
      });

      // Invoke the model with structured output
      const result = await structuredModel.invoke(formattedPrompt);

      return result as BOQExtraction;
    } catch (error) {
      console.error('Error in BOQ generation chain:', error);
      throw new Error(`Failed to generate BOQ: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
