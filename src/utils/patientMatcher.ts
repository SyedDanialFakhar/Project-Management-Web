import type { PatientInterpretation } from './interpretationParser';

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z\s]/g, '');
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  // Check first 4 chars match (handles FITHIE vs Fithe)
  if (na.slice(0, 4) === nb.slice(0, 4)) return 0.8;
  return 0;
}

export function matchPatient(
  firstName: string,
  lastName: string,
  interpretations: PatientInterpretation[]
): PatientInterpretation | null {
  if (!firstName && !lastName) return null;

  let bestMatch: PatientInterpretation | null = null;
  let bestScore = 0;

  for (const interp of interpretations) {
    const firstScore = similarity(firstName, interp.firstName);
    const lastScore  = similarity(lastName, interp.lastName);
    const score = (firstScore * 0.4) + (lastScore * 0.6);

    if (score > bestScore && score >= 0.7) {
      bestScore = score;
      bestMatch = interp;
    }
  }

  return bestMatch;
}