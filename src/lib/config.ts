/**
 * Configuration validation utilities
 * Checks for required environment variables and configuration
 */

/**
 * Check if OpenAI API key is properly configured
 * @returns true if valid API key is present, false otherwise
 */
export function hasValidOpenAIKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;
  
  // Check for common exact placeholder values (case-insensitive)
  const exactPlaceholders = [
    'your_openai_api_key_here',
    'your-api-key',
    'your-api-key-here',
    'insert_key_here',
    'sk-your-key-here',
  ];
  
  const lowerKey = key.toLowerCase().trim();
  return !exactPlaceholders.includes(lowerKey);
}

/**
 * Check if database URL is properly configured
 * @returns true if valid database URL is present, false otherwise
 */
export function hasValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  
  // Check for common placeholder patterns in database URLs
  const hasPlaceholder = (
    url.includes('user:password@') ||
    url.includes('username:password@') ||
    url.includes('your_password') ||
    url.toLowerCase().includes('insert_url_here')
  );
  
  return !hasPlaceholder;
}

/**
 * Get configuration status for display
 * @returns Object with configuration status
 */
export function getConfigurationStatus() {
  return {
    hasOpenAIKey: hasValidOpenAIKey(),
    hasDatabaseUrl: hasValidDatabaseUrl(),
    isFullyConfigured: hasValidOpenAIKey() && hasValidDatabaseUrl(),
  };
}

/**
 * Constants for error messages
 */
export const MOCK_ENDPOINT_PATH = '/api/tenders/upload-mock';
export const SETUP_GUIDE_PATH = 'SETUP_GUIDE.md';
