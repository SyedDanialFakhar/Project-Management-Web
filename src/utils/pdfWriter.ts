// utils/pdfWriter.ts
//
// Writes interpretation text directly under the "Interpretation" heading.
// ALWAYS targets page 1 (index 0) — that is where the heading always lives.
// Does NOT use pdfjs at all (pdfjs has a bug where it reports page-1 text
// as belonging to page 2 in multi-page PDFs, which was causing the text to
// land on the wrong page every time).
//
// Instead, we scan the raw PDF content stream bytes of page 1 to find the
// Y coordinate of the "Interpretation" text, then draw directly below it.

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PatientInterpretation } from '@/types/pdfInterpretation';

// ─── Find the Y of "Interpretation" by scanning raw page bytes ───────────────
//
// PDF text drawing looks like this in the content stream:
//   ... <number> <number> Td   or   <matrix> Tm
//   (Interpretation) Tj
//
// We search for the byte sequence "(Interpretation" and then walk backwards
// to find the preceding Tm or Td y-value.
// pdf-lib y = distance from BOTTOM of page, increasing upward.

function findInterpretationY(page: ReturnType<PDFDocument['getPage']>): number | null {
  try {
    // Get raw content stream bytes as a string for regex scanning
    const contentStreams = (page as any).node.Contents();
    if (!contentStreams) return null;

    // Collect all content stream bytes
    let raw = '';
    const collectStream = (obj: any) => {
      try {
        if (obj && typeof obj.getContents === 'function') {
          const bytes = obj.getContents();
          raw += new TextDecoder('latin1').decode(bytes);
        } else if (obj && typeof obj.asArray === 'function') {
          for (const item of obj.asArray()) collectStream(item);
        }
      } catch { /* skip unreadable streams */ }
    };
    collectStream(contentStreams);

    if (!raw) return null;

    // Match patterns like:
    //   96.693 Tf ... BT ... tx ty Tm ... (Interpretation) Tj
    // We look for "Interpretation" as a PDF string literal and grab
    // the most recent Tm [a b c d tx ty] before it.

    // Find all Tm commands and their positions in the stream
    const tmRegex = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm/g;
    const tmMatches: { index: number; ty: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = tmRegex.exec(raw)) !== null) {
      tmMatches.push({ index: m.index, ty: parseFloat(m[6]) });
    }

    // Find "Interpretation" as a PDF string — it appears as (Interpretation) or
    // as part of a TJ array like [(Interpretation)]
    const interpRegex = /\(Interpretation[\s:)]/g;
    const interpMatches: number[] = [];
    while ((m = interpRegex.exec(raw)) !== null) {
      interpMatches.push(m.index);
    }

    if (interpMatches.length === 0 || tmMatches.length === 0) return null;

    // For the first "Interpretation" occurrence, find the last Tm before it
    const interpPos = interpMatches[0];
    let closestTm: { index: number; ty: number } | null = null;
    for (const tm of tmMatches) {
      if (tm.index < interpPos) closestTm = tm;
      else break;
    }

    return closestTm?.ty ?? null;
  } catch {
    return null;
  }
}

// ─── Wrap text ────────────────────────────────────────────────────────────────

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontSize: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (current && font.widthOfTextAtSize(test, fontSize) > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function writeInterpretationToPdf(
  originalBuffer: ArrayBuffer,
  interpretation: PatientInterpretation
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(new Uint8Array(originalBuffer), {
    ignoreEncryption: true,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const FONT_SIZE    = 9.5;
  const LINE_HEIGHT  = 13.5;
  const LEFT_MARGIN  = 59;
  const RIGHT_MARGIN = 48;
  const FOOTER_SAFE  = 55;   // never draw below this y on page 1
  const GAP          = 4;    // pt between heading baseline and first text line

  // ALWAYS use page 1 (index 0) — the heading is always there
  const page      = pdfDoc.getPages()[0];
  const pageW     = page.getWidth();
  const pageH     = page.getHeight();
  const maxWidth  = pageW - LEFT_MARGIN - RIGHT_MARGIN;
  const lines     = wrapText(interpretation.interpretation, font, FONT_SIZE, maxWidth);

  // Try to find the exact Y of the heading from the raw content stream
  let headingY = findInterpretationY(page);

  // Fallback: known Y values from measuring all current GANSHORN report types
  // Type A (1-page spiro + DLCO):   heading at pdf-lib y ≈ 132
  // Type B (2-page mannitol):       heading at pdf-lib y ≈ 97
  // Type C (1-page Griffith):       heading at pdf-lib y ≈ 125
  // We pick the lower of the known values as a safe fallback so we never
  // overshoot above the heading itself.
  if (headingY === null || headingY < 50 || headingY > 400) {
    // Unknown — place text at a safe conservative position
    headingY = 97;
  }

  // First text line starts just below the heading baseline
  const startY    = headingY - GAP - FONT_SIZE;
  const lastLineY = startY - (lines.length - 1) * LINE_HEIGHT;

  if (lastLineY >= FOOTER_SAFE) {
    // ✅ All lines fit on page 1 below the heading
    let y = startY;
    for (const line of lines) {
      page.drawText(line, { x: LEFT_MARGIN, y, size: FONT_SIZE, font, color: rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    }
  } else {
    // ❌ Not enough room — insert a blank page immediately after page 1
    // (page 2 and beyond, e.g. mannitol tables, shift to page 3+)
    pdfDoc.insertPage(1, [pageW, pageH]);
    const newPage = pdfDoc.getPages()[1];
    let y = pageH - 72;
    for (const line of lines) {
      newPage.drawText(line, { x: LEFT_MARGIN, y, size: FONT_SIZE, font, color: rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    }
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}