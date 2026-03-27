import { useState } from 'react';
import { withRetry, getCachedTranscript, setCachedTranscript } from '@/utils/aiHelpers';
import { detectTemplate, type TemplateId } from '@/lib/templateRegistry';

const MISTRAL_API_KEY = "hLpm8C7uDjlu6EFpc1UclJIVjgHB2jqh";
if (!MISTRAL_API_KEY) {
  console.error('MISTRAL_API_KEY is missing');
}

export interface ExtractedLetterData {
  // ── Template ──────────────────────────────────────────────
  templateId: TemplateId;

  // ── Referring Doctor ──────────────────────────────────────
  referringDoctorName: string;
  referringDoctorClinic: string;
  referringDoctorAddress: string;
  salutation: string;

  // ── Patient ───────────────────────────────────────────────
  patientName: string;
  patientDOB: string;
  patientContact: string;
  patientAddress: string;
  date: string;

  // ── Bullet sections (Sarah template only) ─────────────────
  pmhx: string[];
  medications: string[];
  allergies: string[];
  socialHistory: string[];

  // ── Letter body ───────────────────────────────────────────
  body: string;

  /** @deprecated kept for backwards compat — always [] */
  plan: string[];
}

export function useLetterGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractAndGenerate = async (transcript: string): Promise<ExtractedLetterData> => {
    const cached = getCachedTranscript(transcript);
    if (cached) return cached;

    setIsGenerating(true);
    setError(null);

    try {
      // ── 1. Detect which template / doctor this transcript belongs to ──
      const template = detectTemplate(transcript);
      const isSenthuran = template.id === 'senthuran';

      const today = new Date().toLocaleDateString('en-AU', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      // ── 2. Build a template-specific prompt so the AI extracts the right fields ──
      const bulletInstructions = isSenthuran
        ? `// pmhx, medications, allergies, socialHistory are NOT used in this template.
// Leave them as empty arrays.`
        : `// Extract all bullet-point sections carefully.`;

      const systemPrompt = isSenthuran
        ? `You are a medical secretary for Dr Senthuran Shivakumar (Respiratory & Sleep Physician). 
Extract structured data from the doctor's dictated transcript and return ONLY valid JSON with no extra text or markdown.
The letter body should be a single flowing narrative paragraph — do NOT use bullet points in the body.`
        : `You are a medical secretary for Dr Sarah Yeo (Respiratory & Sleep Specialist). 
Extract structured data from the doctor's dictated transcript and return ONLY valid JSON with no extra text or markdown.`;

      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        try {
          const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'mistral-small-latest',
              temperature: 0.1,
              max_tokens: 3000,
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: `Extract all information from this medical dictation and return as JSON.

Today's date if not specified: ${today}
Doctor template: ${template.doctorName}

Return EXACTLY this JSON structure:
{
  "referringDoctorName": "full name with title e.g. Dr John Smith",
  "referringDoctorClinic": "clinic or practice name",
  "referringDoctorAddress": "full address on one line",
  "patientName": "Title FirstName LastName e.g. Ms Yvonne Brown",
  "patientDOB": "DD/MM/YYYY",
  "patientContact": "phone number if mentioned, else empty string",
  "patientAddress": "full address if mentioned, else empty string",
  "date": "DD Month YYYY e.g. 19 February 2026",
  "salutation": "first name only of the referring doctor",
  "pmhx": [],
  "medications": [],
  "allergies": [],
  "socialHistory": [],
  "body": "Full professional medical letter body as a single flowing paragraph",
  "plan": []
}

${bulletInstructions}

TRANSCRIPT:
${transcript.slice(0, 6000)}`,
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

      // ── 3. Stamp the detected templateId onto the result ──
      result.templateId = template.id;
      result.plan = [];
      result.pmhx = result.pmhx || [];
      result.medications = result.medications || [];
      result.allergies = result.allergies || [];
      result.socialHistory = result.socialHistory || [];

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