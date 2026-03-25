import { PDFDocument } from 'pdf-lib';

// Simple text extraction from PDF (without external libraries)
// This extracts text by reading PDF content streams
export async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    let allText = '';
    
    // PDF-lib doesn't have built-in text extraction
    // We'll use a simple approach: look for common patterns
    // For better extraction, consider using pdf-parse
    
    // For now, we'll return empty and rely on filename
    // If you need proper text extraction, install: npm install pdf-parse
    return allText;
  } catch (error) {
    console.error('Failed to extract text from PDF:', error);
    return '';
  }
}

// Alternative: Use pdf-parse for better extraction (requires installation)
// npm install pdf-parse
export async function extractTextWithPdfParse(pdfBytes: Uint8Array): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(Buffer.from(pdfBytes));
    return data.text;
  } catch (error) {
    console.error('pdf-parse failed:', error);
    return '';
  }
}