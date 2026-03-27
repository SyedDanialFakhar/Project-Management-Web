// utils/pdfWriter.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { pdfjs } from '@/lib/pdfWorker';
import type { PatientInterpretation } from '@/types/pdfInterpretation';

interface TextItem {
  text: string;
  x: number;
  y: number;        // pdf.js = distance from BOTTOM of page
  pageIndex: number;
  fontSize: number;
}

interface HeadingInfo {
  x: number;
  y: number;        // pdf.js bottom-up
  pageIndex: number;
  pageHeight: number;
  pageWidth: number;
  fontSize: number;
}

/** Extract all text with coordinates */
async function extractAllTextItems(data: Uint8Array) {
  const pdf = await pdfjs.getDocument({ data: data.slice() }).promise;
  const items: TextItem[] = [];
  const pageSizes: { width: number; height: number }[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    pageSizes.push({ width: viewport.width, height: viewport.height });

    for (const item of content.items as any[]) {
      if (!item.str?.trim()) continue;
      items.push({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        pageIndex: p - 1,
        fontSize: item.height || 10,
      });
    }
  }
  return { items, pageSizes };
}

/** Robust heading finder */
function findInterpretationHeading(
  items: TextItem[],
  pageSizes: { width: number; height: number }[]
): HeadingInfo | null {
  const variants = [
    'interpretation',
    'interpretation:',
    'interpretations',
    'INTERPRETATION',
    'Interpretation'
  ];

  for (let pageIdx = 0; pageIdx < pageSizes.length; pageIdx++) {
    const pageItems = items.filter(i => i.pageIndex === pageIdx);

    const lineMap = new Map<number, TextItem[]>();
    for (const item of pageItems) {
      const roundedY = Math.round(item.y / 3) * 3;
      if (!lineMap.has(roundedY)) lineMap.set(roundedY, []);
      lineMap.get(roundedY)!.push(item);
    }

    for (const [y, lineItems] of lineMap) {
      const lineText = lineItems
        .sort((a, b) => a.x - b.x)
        .map(i => i.text.trim())
        .join(' ')
        .trim()
        .toLowerCase();

      if (variants.some(v => lineText === v || lineText.startsWith(v))) {
        const firstItem = lineItems[0];
        return {
          x: firstItem.x,
          y: y,
          pageIndex: pageIdx,
          pageHeight: pageSizes[pageIdx].height,
          pageWidth: pageSizes[pageIdx].width,
          fontSize: firstItem.fontSize,
        };
      }
    }
  }
  return null;
}

/** Wrap text */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
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

/** FINAL FIXED MAIN FUNCTION */
export async function writeInterpretationToPdf(
  originalBuffer: ArrayBuffer,
  interpretation: PatientInterpretation
): Promise<Blob> {
  const uint8 = new Uint8Array(originalBuffer);
  const { items, pageSizes } = await extractAllTextItems(uint8);

  const heading = findInterpretationHeading(items, pageSizes);

  const pdfDoc = await PDFDocument.load(uint8, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9.5;
  const lineHeight = 13.5;
  const leftMargin = 48;
  const rightMargin = 48;
  const bottomMargin = 65;
  const gapBelowHeading = 18;   // ← tuned for clean spacing under heading

  const pageWidth = heading?.pageWidth || pages[0].getWidth();
  const maxTextWidth = pageWidth - leftMargin - rightMargin;

  const lines = wrapText(interpretation.interpretation, font, fontSize, maxTextWidth);

  let targetPageIndex = 0;
  let insertY = 0;   // pdf-lib Y (from bottom)

  if (heading) {
    // ✅ Place DIRECTLY under the heading on the SAME page
    insertY = heading.y - gapBelowHeading;
    targetPageIndex = heading.pageIndex;

    // Only move to next page if the text is truly too long to fit
    const totalTextHeight = lines.length * lineHeight;
    const availableSpace = insertY - bottomMargin;

    if (totalTextHeight > availableSpace) {
      targetPageIndex = heading.pageIndex + 1;
      if (targetPageIndex < pages.length) {
        insertY = pages[targetPageIndex].getHeight() - 100;
      } else {
        const newPage = pdfDoc.addPage([pageWidth, heading.pageHeight]);
        pages.push(newPage);
        targetPageIndex = pages.length - 1;
        insertY = newPage.getHeight() - 100;
      }
    }
  } else {
    // Fallback
    targetPageIndex = pages.length - 1;
    insertY = pages[targetPageIndex].getHeight() - 140;
  }

  // Ensure page exists
  while (targetPageIndex >= pages.length) {
    const newPage = pdfDoc.addPage([pageWidth, pages[0].getHeight()]);
    pages.push(newPage);
  }

  const page = pages[targetPageIndex];
  let y = insertY;

  // Draw the text
  for (const line of lines) {
    if (y < bottomMargin) {
      const newPage = pdfDoc.addPage([pageWidth, pages[0].getHeight()]);
      pages.push(newPage);
      const newIndex = pages.length - 1;
      y = pages[newIndex].getHeight() - 100;
      page = pages[newIndex];
    }

    page.drawText(line, {
      x: leftMargin,
      y: y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    y -= lineHeight;
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}