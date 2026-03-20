import { useState } from 'react';

export function useDocumentFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fixDocument = async (text: string): Promise<string> => {
    setIsFixing(true);
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: `You are a professional document editor. Your job is to:
1. Fix all grammar and spelling mistakes
2. Fix punctuation errors
3. Improve sentence structure where needed
4. Fix formatting inconsistencies
5. Keep the original meaning, tone and structure intact
Return ONLY the corrected text with no explanations, comments or extra content.`,
          messages: [{ role: 'user', content: `Please fix this document:\n\n${text}` }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API error');

      const fixed = data.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

      return fixed;
    } catch (err: any) {
      setError(err.message || 'Failed to fix document');
      throw err;
    } finally {
      setIsFixing(false);
    }
  };

  return { fixDocument, isFixing, error };
}