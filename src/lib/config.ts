/**
 * Configuration validation utilities
 * Checks for required environment variables and configuration
 */

/**
 * Check if OpenAI API key is properly configured
 * @returns true if valid API key is present, false otherwise
 */
export function hasValidOpenAIKey(): boolean {
  // Explicitly check process.env.OPENAI_API_KEY (not any other variable)
  const key = process.env.OPENAI_API_KEY;
  
  // Return false if key is not set or is empty/whitespace
  if (!key || key.trim() === '') {
    return false;
  }
  
  // Check for common exact placeholder values (case-insensitive)
  const exactPlaceholders = [
    'your_openai_api_key_here',
    'your-api-key',
    'your-api-key-here',
    'insert_key_here',
    'sk-your-key-here',
    'your_key_here',
    'replace_with_your_key',
  ];
  
  const lowerKey = key.toLowerCase().trim();
  
  // Return false if the key matches any placeholder
  if (exactPlaceholders.includes(lowerKey)) {
    return false;
  }
  
  // OpenAI keys should start with 'sk-' (for most key types)
  // but we'll accept any non-placeholder value for flexibility
  return true;
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
