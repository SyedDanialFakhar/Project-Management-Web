import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PatientInterpretation } from './interpretationParser';

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function writeInterpretationToPdf(
  arrayBuffer: ArrayBuffer,
  interpretation: PatientInterpretation
): Promise<Blob> {
  // ✅ Make a fresh copy — original may be detached after pdfjs used it
  const copy = arrayBuffer.slice(0);

  const pdfDoc = await PDFDocument.load(copy, { ignoreEncryption: true });
  const page   = pdfDoc.getPages()[0];
  const { height } = page.getSize();

  const font       = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize   = 8.5;
  const lineHeight = 12;
  const startX     = 59.7;
  const startY     = height - 668;
  const maxWidth   = 490;

  const lines = wrapText(interpretation.interpretation, font, fontSize, maxWidth);
  lines.forEach((line, idx) => {
    const y = startY - idx * lineHeight;
    if (y > 65) {
      page.drawText(line, { x: startX, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }
  });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}