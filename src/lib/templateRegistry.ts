// ============================================================
//  templateRegistry.ts
//  Central config mapping doctor templates.
//  Add new doctors here — no other files need changing.
// ============================================================

export type TemplateId = 'sarah' | 'senthuran';

export interface TemplateConfig {
  id: TemplateId;
  /** Path relative to /public */
  file: string;
  /** Human-readable doctor name shown in UI */
  doctorName: string;
  /** Phrases searched (case-insensitive) in the raw transcript to pick this template */
  detectionPhrases: string[];
  /** Whether this template uses bullet-list sections (PMHx / Meds / Allergies / Social Hx) */
  hasBulletSections: boolean;
}

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  sarah: {
    id: 'sarah',
    file: '/LETTER_TEMPLATE_FINAL.docx',
    doctorName: 'Dr Sarah Yeo',
    detectionPhrases: [
      'dr sarah',
      'dr yeo',
      'this is sarah',
      'sarah dictating',
      'sarah yeo',
    ],
    hasBulletSections: true,
  },
  senthuran: {
    id: 'senthuran',
    file: '/LETTER_TEMPLATE_SENTHURAN.docx',
    doctorName: 'Dr Senthuran Shivakumar',
    detectionPhrases: [
      'dr senthuran',
      'dr shivakumar',
      'senthuran dictating',
      'this is senthuran',
      'senthuran shivakumar',
      'shivakumar',
    ],
    hasBulletSections: false,
  },
};

/** Default template used when no doctor is detected */
export const DEFAULT_TEMPLATE_ID: TemplateId = 'sarah';

/**
 * Scans a transcript and returns the matching TemplateConfig.
 * Falls back to the default (Sarah) if nothing matches.
 */
export function detectTemplate(transcript: string): TemplateConfig {
  const lower = transcript.toLowerCase();

  for (const config of Object.values(TEMPLATES)) {
    // Skip the default — we only want to detect non-default doctors first
    if (config.id === DEFAULT_TEMPLATE_ID) continue;
    if (config.detectionPhrases.some((phrase) => lower.includes(phrase))) {
      return config;
    }
  }

  // Check if Sarah is explicitly mentioned too (still returns her template)
  return TEMPLATES[DEFAULT_TEMPLATE_ID];
}