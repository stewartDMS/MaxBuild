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
  
  // Check for common placeholder values
  const placeholders = [
    'your_openai_api_key_here',
    'your-api-key',
    'sk-your-key-here',
    'INSERT_KEY_HERE',
  ];
  
  return !placeholders.some(placeholder => 
    key.toLowerCase().includes(placeholder.toLowerCase())
  );
}

/**
 * Check if database URL is properly configured
 * @returns true if valid database URL is present, false otherwise
 */
export function hasValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  
  // Check for common placeholder values
  const placeholders = [
    'user:password@localhost',
    'username:password',
    'your_password',
    'INSERT_URL_HERE',
  ];
  
  return !placeholders.some(placeholder => 
    url.toLowerCase().includes(placeholder.toLowerCase())
  );
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
