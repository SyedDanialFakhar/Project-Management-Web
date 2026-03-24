import { useState } from 'react';
import { withRetry, getCachedTranscript, setCachedTranscript } from '@/utils/aiHelpers';

const MISTRAL_API_KEY = "hLpm8C7uDjlu6EFpc1UclJIVjgHB2jqh";
if (!MISTRAL_API_KEY) {
  console.error('VITE_MISTRAL_API_KEY is missing from .env file');
}

export interface ExtractedLetterData {
  referringDoctorName: string;
  referringDoctorClinic: string;
  referringDoctorAddress: string;
  patientName: string;
  patientDOB: string;
  patientContact: string;
  patientAddress: string;
  date: string;
  salutation: string;
  pmhx: string[];
  medications: string[];
  allergies: string[];
  socialHistory: string[];
  body: string;
  plan: string[];
}

export function useLetterGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractAndGenerate = async (transcript: string): Promise<ExtractedLetterData> => {
    // Check cache first
    const cached = getCachedTranscript(transcript);
    if (cached) return cached;

    setIsGenerating(true);
    setError(null);

    try {
      const today = new Date().toLocaleDateString('en-AU', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

        try {
          const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'mistral-small-latest', // Changed from large to small for speed
              temperature: 0.1,
              max_tokens: 3000, // Reduced from 4000
              messages: [
                {
                  role: 'system',
                  content: 'You are a medical secretary. Extract structured data from a doctor\'s dictated transcript and return ONLY valid JSON with no extra text or markdown.',
                },
                {
                  role: 'user',
                  content: `Extract all information from this medical dictation and return as JSON.

Today's date if not specified: ${today}

Return EXACTLY this JSON structure:
{
  "referringDoctorName": "full name with title",
  "referringDoctorClinic": "clinic name",
  "referringDoctorAddress": "full address",
  "patientName": "Mr/Ms/Mrs FirstName LastName",
  "patientDOB": "DD/MM/YYYY",
  "patientContact": "phone if mentioned",
  "patientAddress": "address if mentioned",
  "date": "Month DD, YYYY",
  "salutation": "first name only",
  "pmhx": ["condition 1"],
  "medications": ["medication with dose"],
  "allergies": ["allergy with reaction"],
  "socialHistory": ["social point"],
  "body": "Full professional medical letter body",
  "plan": []
}

TRANSCRIPT (truncated if needed):
${transcript.slice(0, 6000)}`, // Truncate very long transcripts
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
      if (!response.ok) throw new Error(data.message || data.error?.message || 'Mistral API error');

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned) as ExtractedLetterData;
      
      // Ensure required fields exist
      result.plan = result.plan || [];
      result.pmhx = result.pmhx || [];
      result.medications = result.medications || [];
      result.allergies = result.allergies || [];
      result.socialHistory = result.socialHistory || [];

      // Cache the result
      setCachedTranscript(transcript, result);
      
      return result;

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate letter';
      setError(errorMsg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { extractAndGenerate, isGenerating, error };
}