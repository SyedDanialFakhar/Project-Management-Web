import { pdfjs } from '@/lib/pdfWorker';

export interface PdfTextData {
  fullText: string;
  firstName: string;
  lastName: string;
}

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<PdfTextData> {
  try {
    // ✅ THE FIX: pdfjs transfers (detaches) the ArrayBuffer after use
    // Make a copy so the original stays usable for pdf-lib afterwards
    const copy = arrayBuffer.slice(0);

    const pdf = await pdfjs.getDocument({ data: copy }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str || '').join(' ') + '\n';
    }

    const lastMatch  = fullText.match(/Last\s+name\s+([A-Z][A-Za-z'\-]+)/);
    const firstMatch = fullText.match(/First\s+name\s+([A-Za-z][A-Za-z'\-]+)/);

    return {
      fullText,
      lastName:  lastMatch?.[1]  ?? '',
      firstName: firstMatch?.[1] ?? '',
    };

  } catch (err: any) {
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }
}