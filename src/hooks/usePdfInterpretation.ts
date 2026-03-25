import { useState } from 'react';
import { extractPdfText } from '@/utils/pdfExtractor';
import { matchPatient } from '@/utils/patientMatcher';
import { writeInterpretationToPdf } from '@/utils/pdfWriter';
import type { PatientInterpretation } from '@/utils/interpretationParser';

export interface ProcessResult {
  blob: Blob;
  patientName: string;
  interpretation: string;
  fileName: string;
}

export function usePdfInterpretation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPdf = async (
    pdfFile: File,
    interpretations: PatientInterpretation[]
  ): Promise<ProcessResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // ✅ Read file ONCE into Uint8Array — never gets detached unlike ArrayBuffer
      const uint8 = new Uint8Array(await pdfFile.arrayBuffer());

      // Step 1 — Extract text (pass a copy so pdfjs can transfer it)
      const pdfData = await extractPdfText(uint8.buffer.slice(0));

      if (!pdfData.firstName && !pdfData.lastName) {
        throw new Error(
          'Could not find patient name in PDF. ' +
          'Make sure the PDF has "Last name" and "First name" fields.'
        );
      }

      // Step 2 — Match
      const match = matchPatient(pdfData.firstName, pdfData.lastName, interpretations);
      if (!match) {
        const available = interpretations
          .map(p => `${p.firstName} ${p.lastName}`)
          .join(', ');
        throw new Error(
          `No match found for "${pdfData.firstName} ${pdfData.lastName}".\n` +
          `Available: ${available}`
        );
      }

      // Step 3 — Write (pass another fresh copy — original uint8 is still intact)
      const blob = await writeInterpretationToPdf(uint8.buffer.slice(0), match);

      return {
        blob,
        patientName: `${pdfData.firstName} ${pdfData.lastName}`,
        interpretation: match.interpretation,
        fileName: pdfFile.name.replace(/\.pdf$/i, '') + '_interpreted.pdf',
      };

    } catch (err: any) {
      const msg = err.message || 'Failed to process PDF';
      setError(msg);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processPdf, isProcessing, error, setError };
}