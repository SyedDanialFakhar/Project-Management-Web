import { useState } from 'react';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
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
    setIsGenerating(true);
    setError(null);

    try {
      const today = new Date().toLocaleDateString('en-AU', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          temperature: 0.1,
          max_tokens: 4000,
          messages: [
            {
              role: 'system',
              content: 'You are a medical secretary. Extract structured data from a doctor\'s dictated transcript and return ONLY valid JSON with no extra text or markdown.',
            },
            {
              role: 'user',
              content: `Extract all information from this medical dictation and return as JSON.

Today's date if not specified: ${today}

Return EXACTLY this JSON structure (no markdown, no extra text):
{
  "referringDoctorName": "full name with title e.g. Dr. John Smith",
  "referringDoctorClinic": "clinic name",
  "referringDoctorAddress": "full address",
  "patientName": "Mr/Ms/Mrs FirstName LastName",
  "patientDOB": "DD/MM/YYYY",
  "patientContact": "phone if mentioned, else empty string",
  "patientAddress": "address if mentioned, else empty string",
  "date": "Month DD, YYYY format e.g. April 08, 2025",
  "salutation": "first name only of referring doctor",
  "pmhx": ["condition 1"],
  "medications": ["medication with dose"],
  "allergies": ["allergy with reaction"],
  "socialHistory": ["social point"],
  "body": "Full professional medical letter body. Fix speech-to-text errors. Multiple paragraphs separated by \\n\\n.",
  "plan": []
}

Rules:
- Fix speech-to-text errors
- If PMHx nil, return ["Nil"]
- If no allergies, return ["No known drug allergies"]
- Body should be polished professional medical prose
- Plan is always empty []

TRANSCRIPT:
${transcript}`,
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error?.message || 'Mistral API error');

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as ExtractedLetterData;

    } catch (err: any) {
      setError(err.message || 'Failed to generate letter');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { extractAndGenerate, isGenerating, error };
}