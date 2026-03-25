export interface PatientInterpretation {
    firstName: string;
    lastName: string;
    fullName: string;
    interpretation: string;
  }
  
  const MEDICAL_KEYWORDS = /ventilat|obstruct|restrict|spirom|diffus|broncho|lung|gas\s+transfer|asthma|COPD|pattern|interstitial|parenchym|bronchodilat|reversib|airway|diaphragm|neuromuscular|pulmonary|vascular/i;
  
  function isNameLine(line: string): boolean {
    if (!line.trim()) return false;
    if (MEDICAL_KEYWORDS.test(line)) return false;
    if (line.split(' ').length > 5) return false;
    if (line.length > 60) return false;
    if (/^\d/.test(line)) return false;
    return true;
  }
  
  export function parseInterpretations(rawText: string): PatientInterpretation[] {
    const results: PatientInterpretation[] = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
  
      if (isNameLine(line)) {
        const interpLines: string[] = [];
        i++;
  
        while (i < lines.length) {
          const next = lines[i];
          if (isNameLine(next) && interpLines.length > 0) break;
          interpLines.push(next);
          i++;
        }
  
        if (interpLines.length > 0) {
          const parts = line.trim().split(/\s+/);
          const firstName = parts[0];
          const lastName  = parts.slice(1).join(' ');
  
          results.push({
            firstName,
            lastName,
            fullName: line.trim().toLowerCase(),
            interpretation: interpLines.join(' ').trim(),
          });
        }
      } else {
        i++;
      }
    }
  
    return results;
  }