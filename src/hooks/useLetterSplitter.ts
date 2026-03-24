import { useState } from 'react';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

export function useLetterSplitter() {
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitTranscript = async (fullText: string): Promise<string[]> => {
    setIsSplitting(true);
    setError(null);

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          temperature: 0.1,
          max_tokens: 6000,
          messages: [
            {
              role: 'system',
              content: 'You are a medical secretary. Split a transcript containing multiple patient dictations into separate individual dictations. Return ONLY a JSON array of strings. No markdown, no explanation.',
            },
            {
              role: 'user',
              content: `This transcript contains multiple patient dictations. Split them into separate individual dictations.

Rules:
- Each dictation starts with a new patient name, DOB, or "dictating for"
- Keep each complete and intact
- Do not modify the text
- Return: ["full dictation 1", "full dictation 2", ...]

TRANSCRIPT:
${fullText}`,
            },
          ],
        }),
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

      return parts;

    } catch (err: any) {
      setError(err.message || 'Failed to split transcript');
      throw err;
    } finally {
      setIsSplitting(false);
    }
  };

  return { splitTranscript, isSplitting, error };
}