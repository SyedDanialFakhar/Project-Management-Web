import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { pdfjs } from '@/lib/pdfWorker';
import type { PatientInterpretation } from '@/types/pdfInterpretation';
// ─── Types ────────────────────────────────────────────────────────────────────

interface TextItem {
  text: string;
  x: number;
  y: number;        // pdf.js bottom-up coordinate (from page bottom)
  pageIndex: number;
  fontSize: number;
}

interface HeadingInfo {
  x: number;
  y: number;           // pdf.js bottom-up coordinate (from page BOTTOM)
  pageIndex: number;
  pageHeight: number;
  pageWidth: number;
  fontSize: number;
}

// ─── Extract all text items with coordinates ─────────────────────────────────

async function extractAllTextItems(
  data: Uint8Array
): Promise<{ items: TextItem[]; pageSizes: { width: number; height: number }[] }> {
  const pdf = await pdfjs.getDocument({ data: data.slice() }).promise;
  const items: TextItem[] = [];
  const pageSizes: { width: number; height: number }[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    pageSizes.push({ width: viewport.width, height: viewport.height });

    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      
      items.push({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],        // pdf.js: distance from page BOTTOM
        pageIndex: p - 1,
        fontSize: item.height || 10,
      });
    }
  }

  return { items, pageSizes };
}

// ─── Find the "Interpretation" heading ───────────────────────────────────────

function findInterpretationHeading(
  items: TextItem[],
  pageSizes: { width: number; height: number }[]
): HeadingInfo | null {
  
  for (let pageIdx = 0; pageIdx < pageSizes.length; pageIdx++) {
    const pageItems = items.filter(i => i.pageIndex === pageIdx);
    
    // Group by Y coordinate (within 3 points for same line)
    const lineMap = new Map<number, TextItem[]>();
    for (const item of pageItems) {
      const roundedY = Math.round(item.y / 3) * 3;
      if (!lineMap.has(roundedY)) lineMap.set(roundedY, []);
      lineMap.get(roundedY)!.push(item);
    }
    
    // Find line that exactly matches "Interpretation"
    for (const [y, lineItems] of lineMap) {
      const lineText = lineItems.map(i => i.text).join(' ').trim();
      const lowerText = lineText.toLowerCase();
      
      if (lowerText === 'interpretation' || 
          lowerText === 'interpretation:' || 
          lowerText === 'interpretations') {
        
        const sorted = lineItems.sort((a, b) => a.x - b.x);
        const firstItem = sorted[0];
        
        return {
          x: firstItem.x,
          y: y,  // Y coordinate from BOTTOM of page (pdf.js)
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

// ─── Text wrapping function ───────────────────────────────────────────────────

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  
  return lines;
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function writeInterpretationToPdf(
  originalBuffer: ArrayBuffer,
  interpretation: PatientInterpretation
): Promise<Blob> {

  // ── Step 1: Extract text items with coordinates ──────────────────────────
  const uint8 = new Uint8Array(originalBuffer);
  const { items, pageSizes } = await extractAllTextItems(uint8);

  // ── Step 2: Find the "Interpretation" heading ────────────────────────────
  const heading = findInterpretationHeading(items, pageSizes);

  // ── Step 3: Load PDF for editing ─────────────────────────────────────────
  const pdfDoc = await PDFDocument.load(uint8.buffer.slice(0), { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9;
  const lineHeight = 14;
  const leftMargin = 50;
  const rightMargin = 50;
  const bottomMargin = 50;
  const gapBelowHeading = 12; // 12pt gap below the heading text

  // ── Step 4: Prepare the text lines ───────────────────────────────────────
  const pageWidth = heading?.pageWidth || (pageSizes[0]?.width || 612);
  const maxWidth = pageWidth - leftMargin - rightMargin;
  const lines = wrapText(interpretation.interpretation, font, fontSize, maxWidth);
  const totalHeightNeeded = lines.length * lineHeight;

  let targetPageIndex: number;
  let insertY_pdfLib: number; // pdf-lib TOP-DOWN coordinate

  if (heading) {
    // ── Heading found: calculate position BELOW it ─────────────────────────
    const headingBottomY = heading.pageHeight - (heading.y + heading.fontSize);
    insertY_pdfLib = headingBottomY - gapBelowHeading;
    targetPageIndex = heading.pageIndex;
    
    // Check if there's enough space on this page
    if (insertY_pdfLib - totalHeightNeeded < bottomMargin) {
      targetPageIndex = heading.pageIndex + 1;
      
      if (targetPageIndex < pageSizes.length) {
        const nextPageHeading = findInterpretationHeading(
          items.filter(i => i.pageIndex === targetPageIndex),
          pageSizes
        );
        
        if (nextPageHeading) {
          const nextHeadingBottom = nextPageHeading.pageHeight - (nextPageHeading.y + nextPageHeading.fontSize);
          insertY_pdfLib = nextHeadingBottom - gapBelowHeading;
        } else {
          insertY_pdfLib = pageSizes[targetPageIndex].height - 80;
        }
      } else {
        const newPageHeight = heading.pageHeight;
        const newPage = pdfDoc.addPage([pageWidth, newPageHeight]);
        pages.push(newPage);
        targetPageIndex = pages.length - 1;
        insertY_pdfLib = newPageHeight - 80;
      }
    }
  } else {
    // ── No heading found: use last page ────────────────────────────────────
    const lastPageIndex = pages.length - 1;
    const lastPageHeight = pageSizes[lastPageIndex]?.height || 792;
    insertY_pdfLib = lastPageHeight - 100;
    targetPageIndex = lastPageIndex;
  }

  // Ensure target page exists
  while (targetPageIndex >= pages.length) {
    const newPageHeight = pageSizes[0]?.height || 792;
    const newPage = pdfDoc.addPage([pageWidth, newPageHeight]);
    pages.push(newPage);
  }

  // ✅ FIX: Use a variable instead of reassigning const
  let currentPage = pages[targetPageIndex];
  let currentY = insertY_pdfLib;

  // ── Step 5: Draw the text ────────────────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentY < bottomMargin) {
      // Ran out of space - create new page
      const newPageHeight = currentPage.getHeight();
      const newPage = pdfDoc.addPage([pageWidth, newPageHeight]);
      pages.push(newPage);
      currentPage = newPage;
      currentY = newPageHeight - 80;
    }
    
    currentPage.drawText(line, {
      x: leftMargin,
      y: currentY,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
  }

  // ── Step 6: Save and return ──────────────────────────────────────────────
  const bytes = await pdfDoc.save();
  const safeBuffer = new Uint8Array(bytes).buffer;
  
  return new Blob([safeBuffer], { type: 'application/pdf' });
}