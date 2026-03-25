import { pdfjs } from '@/lib/pdfWorker';

export interface PdfTextData {
  fullText: string;
  firstName: string;
  lastName: string;
  patientId: string;
}

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<PdfTextData> {
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Extract all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }

    // ✅ Regex on clean extracted text
    const lastMatch  = fullText.match(/Last\s+name\s+([A-Z][A-Za-z'\-]+)/);
    const firstMatch = fullText.match(/First\s+name\s+([A-Za-z][A-Za-z'\-]+)/);
    const idMatch    = fullText.match(/Patient\s+Id\s+([A-Z0-9]+)/);

    return {
      fullText,
      lastName:  lastMatch?.[1]  ?? '',
      firstName: firstMatch?.[1] ?? '',
      patientId: idMatch?.[1]    ?? '',
    };

  } catch (err: any) {
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }
}