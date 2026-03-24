// Cache for repeated transcripts
const cache = new Map<string, any>();

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      // Don't retry on certain errors
      if (err.message?.includes('API key') || 
          err.message?.includes('rate limit') && i === maxRetries) {
        throw err;
      }
      if (i === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

export function getCachedTranscript(transcript: string): any | null {
  const hash = transcript.slice(0, 500); // Simple hash for caching
  if (cache.has(hash)) {
    console.log('Using cached result');
    return cache.get(hash);
  }
  return null;
}

export function setCachedTranscript(transcript: string, data: any): void {
  const hash = transcript.slice(0, 500);
  // Limit cache size to 50 items
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(hash, data);
}

export function validateApiKey(key: string): boolean {
  return key?.startsWith('gsk_') && key.length > 20;
}