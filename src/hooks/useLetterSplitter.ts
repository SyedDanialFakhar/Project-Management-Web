import { useState } from 'react';
import { withRetry, getCachedTranscript, setCachedTranscript } from '@/utils/aiHelpers';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

export function useLetterSplitter() {
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitTranscript = async (fullText: string): Promise<string[]> => {
    // Check cache first
    const cached = getCachedTranscript(fullText);
    if (cached) return cached;

    setIsSplitting(true);
    setError(null);

    try {
      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'mistral-small-latest', // Changed to smaller, faster model
              temperature: 0.05, // Lower temperature for faster, more deterministic responses
              max_tokens: 4000, // Reduced from 6000
              messages: [
                {
                  role: 'system',
                  content: 'You are a medical secretary. Split transcripts into separate patient dictations. Return ONLY a JSON array of strings.',
                },
                {
                  role: 'user',
                  content: `Split this transcript into separate patient dictations. Return: ["dictation 1", "dictation 2", ...]
                  
TRANSCRIPT:
${fullText.slice(0, 8000)}`, // Truncate very long transcripts
                },
              ],
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return res;
        } catch (err: any) {
          clearTimeout(timeoutId);
          throw err;
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Mistral API error');

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parts = JSON.parse(cleaned) as string[];

      if (!Array.isArray(parts) || parts.length === 0) {
        throw new Error('Could not split transcript');
      }

      // Cache the result
      setCachedTranscript(fullText, parts);
      
      return parts;

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to split transcript';
      setError(errorMsg);
      throw err;
    } finally {
      setIsSplitting(false);
    }
  };

  return { splitTranscript, isSplitting, error };
}