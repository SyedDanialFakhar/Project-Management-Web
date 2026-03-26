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
  status: 'ready' | 'error';
  error?: string;
}

export function usePdfInterpretation() {
  const [isProcessing, setIsProcessing]   = useState(false);
  const [results, setResults]             = useState<ProcessResult[]>([]);
  const [error, setError]                 = useState<string | null>(null);

  // ✅ Process a single PDF file — returns a result object, never throws
  async function processSinglePdf(
    pdfFile: File,
    interpretations: PatientInterpretation[]
  ): Promise<ProcessResult> {
    try {
      // Read once into Uint8Array so we can make safe copies
      const uint8 = new Uint8Array(await pdfFile.arrayBuffer());

      // Extract text using a copy (pdfjs detaches the buffer)
      const pdfData = await extractPdfText(uint8.buffer.slice(0));

      if (!pdfData.firstName && !pdfData.lastName) {
        throw new Error('Could not find patient name in this PDF');
      }

      // Match interpretation
      const match = matchPatient(pdfData.firstName, pdfData.lastName, interpretations);
      if (!match) {
        const available = interpretations
          .map(p => `${p.firstName} ${p.lastName}`)
          .join(', ');
        throw new Error(
          `No match for "${pdfData.firstName} ${pdfData.lastName}". ` +
          `Available: ${available}`
        );
      }

      // Write into PDF using another fresh copy
      const blob = await writeInterpretationToPdf(uint8.buffer.slice(0), match);

      return {
        blob,
        patientName: `${pdfData.firstName} ${pdfData.lastName}`,
        interpretation: match.interpretation,
        fileName: pdfFile.name.replace(/\.pdf$/i, '') + '_interpreted.pdf',
        status: 'ready',
      };

    } catch (err: any) {
      return {
        blob: new Blob(),
        patientName: pdfFile.name,
        interpretation: '',
        fileName: pdfFile.name,
        status: 'error',
        error: err.message || 'Failed to process',
      };
    }
  }

  // ✅ Process multiple PDFs one by one with live progress updates
  const processAllPdfs = async (
    pdfFiles: File[],
    interpretations: PatientInterpretation[],
    onProgress: (results: ProcessResult[]) => void
  ): Promise<ProcessResult[]> => {
    setIsProcessing(true);
    setError(null);
    setResults([]);

    // Initialize all as pending
    const pending: ProcessResult[] = pdfFiles.map(f => ({
      blob: new Blob(),
      patientName: f.name,
      interpretation: '',
      fileName: f.name,
      status: 'error' as const,
      error: 'Waiting...',
    }));
    onProgress([...pending]);

    const final: ProcessResult[] = [];

    for (let i = 0; i < pdfFiles.length; i++) {
      // Mark current as processing
      pending[i] = { ...pending[i], error: 'Processing...' };
      onProgress([...pending]);

      const result = await processSinglePdf(pdfFiles[i], interpretations);
      pending[i] = result;
      final.push(result);
      onProgress([...pending]);
    }

    setResults(final);
    setIsProcessing(false);
    return final;
  };

  return { processAllPdfs, isProcessing, results, error, setError };
}