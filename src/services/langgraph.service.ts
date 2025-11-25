import { Client } from '@langchain/langgraph-sdk';

/**
 * LangGraph API URL - production endpoint for the agent
 */
const LANGGRAPH_API_URL =
  'https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app';

/**
 * Get the LangGraph API key from environment variables
 * @returns The API key for LangGraph
 * @throws Error if the API key is not configured
 */
function getApiKey(): string {
  const apiKey = process.env.LANGGRAPH_API_KEY;
  if (!apiKey) {
    throw new Error('LANGGRAPH_API_KEY environment variable is not configured');
  }
  return apiKey;
}

/**
 * Create and return a configured LangGraph SDK client
 * @returns Configured LangGraph Client instance
 */
function createClient(): Client {
  return new Client({
    apiUrl: LANGGRAPH_API_URL,
    apiKey: getApiKey(),
    defaultHeaders: {
      'X-Auth-Scheme': 'langsmith-api-key',
    },
  });
}

/**
 * Assistant data returned from LangGraph API
 */
export interface AssistantResponse {
  assistant_id: string;
  graph_id: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  version: number;
  name: string;
}

/**
 * Service for interacting with LangGraph API
 */
export class LangGraphService {
  private client: Client;

  constructor() {
    this.client = createClient();
  }

  /**
   * Fetch an assistant by ID from LangGraph API
   * @param assistantId The unique identifier of the assistant
   * @returns The assistant data
   */
  async getAssistant(assistantId: string): Promise<AssistantResponse> {
    try {
      const assistant = await this.client.assistants.get(assistantId);
      return assistant as AssistantResponse;
    } catch (error) {
      console.error('Error fetching assistant from LangGraph:', error);
      throw error;
    }
  }
}
