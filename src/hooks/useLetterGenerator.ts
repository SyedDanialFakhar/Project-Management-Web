import { useState } from 'react';

const STORAGE_KEY = 'groq_api_key';

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

  const getSavedKey = () => localStorage.getItem(STORAGE_KEY) || '';
  const saveKey = (key: string) => localStorage.setItem(STORAGE_KEY, key);
  const clearKey = () => localStorage.removeItem(STORAGE_KEY);

  const extractAndGenerate = async (
    transcript: string,
    apiKey: string
  ): Promise<ExtractedLetterData> => {
    setIsGenerating(true);
    setError(null);

    try {
      const today = new Date().toLocaleDateString('en-AU', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 3000,
            messages: [
              {
                role: 'system',
                content: `You are a medical secretary. Extract structured data from a doctor's dictated transcript and return ONLY valid JSON with no extra text or markdown.`,
              },
              {
                role: 'user',
                content: `Extract all information from this medical dictation transcript and return as JSON.

Today's date if not specified: ${today}

Return EXACTLY this JSON structure (no markdown, no extra text, just JSON):
{
  "referringDoctorName": "full name with title e.g. Dr. John Smith",
  "referringDoctorClinic": "clinic name",
  "referringDoctorAddress": "full address",
  "patientName": "Mr/Ms/Mrs FirstName LastName",
  "patientDOB": "DD/MM/YYYY",
  "patientContact": "phone if mentioned, else empty string",
  "patientAddress": "address if mentioned, else empty string",
  "date": "Month DD, YYYY format e.g. April 08, 2025",
  "salutation": "first name only of referring doctor e.g. John",
  "pmhx": ["condition 1", "condition 2"],
  "medications": ["medication 1 with dose", "medication 2"],
  "allergies": ["allergy 1 with reaction"],
  "socialHistory": ["social point 1", "social point 2"],
  "body": "Full professional medical letter body paragraphs. Fix any speech-to-text errors. Write in proper medical English. Multiple paragraphs separated by \\n\\n.",
  "plan": ["plan item 1", "plan item 2"]
}

Rules:
- Fix speech-to-text errors (e.g. "Baronia" likely means "Boronia", "Simsia" likely means "Simponi")
- If PMHx is nil/none, return ["Nil"]
- If allergies are none, return ["No known drug allergies"]  
- Body should be polished professional medical prose
- Plan items are the management plan at the end
- Extract date from transcript, use today if not mentioned

TRANSCRIPT:
${transcript}`,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Groq API error');
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      // Clean any markdown if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extracted: ExtractedLetterData = JSON.parse(cleaned);

      return extracted;

    } catch (err: any) {
      const msg = err.message || 'Failed to generate letter';
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { extractAndGenerate, isGenerating, error, getSavedKey, saveKey, clearKey };
}