import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ExtractedPatientInfo, ProcessingResult } from '@/types/pdfInterpretation';

// Load pdf.js from CDN
const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs');

export function usePdfInterpretation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Extract text and positions from PDF using pdf.js ----------
  const extractTextAndPositions = async (pdfBytes: Uint8Array) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const allItems: Array<{ page: number; x: number; y: number; text: string }> = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      for (const item of textContent.items) {
        if (!('str' in item) || !('transform' in item)) continue;
        const transform = item.transform;
        const x = transform[4];
        // Y coordinate from pdf.js is from BOTTOM of page
        const yFromBottom = transform[5];
        // Store as bottom coordinate for now
        allItems.push({ page: i, x, y: yFromBottom, text: item.str });
      }
    }
    return { items: allItems, numPages };
  };

  // ---------- Name extraction from filename ----------
  const extractNameFromFilename = (filename: string): ExtractedPatientInfo | null => {
    const nameWithoutExt = filename.replace(/\.pdf$/i, '');
    const pattern = nameWithoutExt.match(/^([A-Z]+)([a-z]+)\d+/i);
    if (pattern) {
      const lastName = pattern[1].toLowerCase();
      const firstName = pattern[2].toLowerCase();
      return {
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        fullName: `${firstName} ${lastName}`.toLowerCase(),
        fullNameFormatted: `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`,
        confidence: 0.95,
      };
    }
    return null;
  };

  // ---------- Name extraction from PDF content (fallback) ----------
  const extractNameFromPDFContent = async (pdfBytes: Uint8Array): Promise<ExtractedPatientInfo | null> => {
    try {
      const { items } = await extractTextAndPositions(pdfBytes);
      const fullText = items.map(p => p.text).join(' ');
      const match = fullText.match(/Patient:\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/i);
      if (match) {
        return {
          firstName: match[1],
          lastName: match[2],
          fullName: `${match[1].toLowerCase()} ${match[2].toLowerCase()}`,
          fullNameFormatted: `${match[1]} ${match[2]}`,
          confidence: 0.8,
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  // ---------- Unified patient name getter ----------
  const getPatientName = async (
    pdfFile: File,
    pdfBytes: Uint8Array
  ): Promise<{ name: string; formattedName: string; source: 'filename' | 'content'; confidence: number }> => {
    const fromFilename = extractNameFromFilename(pdfFile.name);
    if (fromFilename && fromFilename.confidence > 0.7) {
      return {
        name: fromFilename.fullName,
        formattedName: fromFilename.fullNameFormatted,
        source: 'filename',
        confidence: fromFilename.confidence,
      };
    }
    const fromContent = await extractNameFromPDFContent(pdfBytes);
    if (fromContent) {
      return {
        name: fromContent.fullName,
        formattedName: fromContent.fullNameFormatted,
        source: 'content',
        confidence: fromContent.confidence,
      };
    }
    const fallback = pdfFile.name.replace(/\.pdf$/i, '').replace(/[_\d]/g, ' ').trim();
    return {
      name: fallback.toLowerCase(),
      formattedName: fallback,
      source: 'filename',
      confidence: 0.3,
    };
  };

  // ---------- Parse interpretations file (.txt, .docx, .pdf) ----------
  const parseInterpretationsFile = async (file: File): Promise<Map<string, string>> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let text = '';

    if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      const { items } = await extractTextAndPositions(pdfBytes);
      text = items.map(p => p.text).join('\n');
    } else {
      throw new Error('Unsupported format. Use .txt, .docx, or .pdf');
    }

    const lines = text.split('\n');
    const interpretations = new Map<string, string>();
    let currentName = '';
    let currentText = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const isNameLine = !trimmed.startsWith(' ') && trimmed.length < 50 && !trimmed.match(/^\d/) && (trimmed.match(/[A-Za-z]/g) || []).length > 3;

      if (isNameLine) {
        if (currentName && currentText) {
          interpretations.set(currentName.toLowerCase(), currentText.trim());
        }
        currentName = trimmed;
        currentText = '';
      } else {
        currentText += trimmed + '\n';
      }
    }
    if (currentName && currentText) {
      interpretations.set(currentName.toLowerCase(), currentText.trim());
    }
    return interpretations;
  };

  // ---------- Add interpretation to PDF at correct position ----------
  const addInterpretationToPDF = async (
    pdfBytes: Uint8Array,
    interpretation: string,
    patientName: string
  ): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const { items, numPages } = await extractTextAndPositions(pdfBytes);
    
    // Find the page that contains "Interpretation:" heading
    let targetPageIndex = numPages - 1; // default to last page
    let headingYFromBottom: number | null = null;
    
    for (const item of items) {
      if (item.text.toLowerCase().includes('interpretation:')) {
        targetPageIndex = item.page - 1; // pdf.js pages are 1-indexed, pdf-lib is 0-indexed
        headingYFromBottom = item.y;
        break;
      }
    }
    
    const targetPage = pages[targetPageIndex];
    const { width, height } = targetPage.getSize();
    
    // Convert Y coordinate: pdf.js Y is from BOTTOM, pdf-lib Y is from TOP
    let yPos: number;
    if (headingYFromBottom !== null) {
      // pdf-lib Y = pageHeight - pdf.js Y - offset (to place text below heading)
      yPos = height - headingYFromBottom - 25;
    } else {
      yPos = height - 150; // fallback: 150px from top
    }
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const black = rgb(0, 0, 0);
    const maxWidth = width - 100;
    const lineHeight = 15;
    
    // Word wrapping
    const words = interpretation.split(' ');
    let currentLine = '';
    let currentY = yPos;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, 10);
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          targetPage.drawText(currentLine, { x: 50, y: currentY, size: 10, font, color: black });
          currentY -= lineHeight;
        }
        currentLine = word;
      }
    }
    if (currentLine) {
      targetPage.drawText(currentLine, { x: 50, y: currentY, size: 10, font, color: black });
    }
    
    return await pdfDoc.save();
  };

  // ---------- Single PDF processing ----------
  const processInterpretation = async (
    pdfFile: File,
    interpretationsFile: File
  ): Promise<ProcessingResult> => {
    setIsProcessing(true);
    setError(null);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfUint8 = new Uint8Array(pdfBytes);

      const patientInfo = await getPatientName(pdfFile, pdfUint8);
      const interpretations = await parseInterpretationsFile(interpretationsFile);

      // Fuzzy matching
      let interpretation = null;
      const nameLower = patientInfo.name.toLowerCase();
      const nameFormatted = patientInfo.formattedName.toLowerCase();

      if (interpretations.has(nameLower)) interpretation = interpretations.get(nameLower);
      else if (interpretations.has(nameFormatted)) interpretation = interpretations.get(nameFormatted);
      else {
        for (const [key, value] of interpretations.entries()) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes(nameLower) || nameLower.includes(keyLower)) {
            interpretation = value; break;
          }
          const patientWords = nameLower.split(' ');
          const keyWords = keyLower.split(' ');
          let matchCount = 0;
          for (const pWord of patientWords) {
            for (const kWord of keyWords) {
              if (pWord === kWord || pWord.includes(kWord) || kWord.includes(pWord)) {
                matchCount++; break;
              }
            }
          }
          if (matchCount >= Math.min(patientWords.length, keyWords.length) / 2) {
            interpretation = value; break;
          }
        }
      }

      if (!interpretation) {
        throw new Error(`No interpretation for "${patientInfo.formattedName}". Available: ${Array.from(interpretations.keys()).join(', ')}`);
      }

      const updatedPdfBytes = await addInterpretationToPDF(pdfUint8, interpretation, patientInfo.formattedName);
      const pdfBlob = new Blob([updatedPdfBytes], { type: 'application/pdf' });

      return {
        success: true,
        message: `✓ Added interpretation for ${patientInfo.formattedName} (matched from ${patientInfo.source})`,
        pdfBlob,
        fileName: `interpreted_${pdfFile.name}`,
        patientName: patientInfo.formattedName,
        interpretation,
      };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: `✗ ${err.message}` };
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------- Batch processing ----------
  const processMultipleInterpretations = async (
    pdfFiles: File[],
    interpretationsFile: File,
    onProgress?: (current: number, total: number, fileName: string, patientName: string) => void
  ): Promise<ProcessingResult[]> => {
    setIsProcessing(true);
    setError(null);
    const results: ProcessingResult[] = [];
    try {
      const interpretations = await parseInterpretationsFile(interpretationsFile);
      for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i];
        try {
          const pdfBytes = await pdfFile.arrayBuffer();
          const pdfUint8 = new Uint8Array(pdfBytes);
          const patientInfo = await getPatientName(pdfFile, pdfUint8);
          onProgress?.(i + 1, pdfFiles.length, pdfFile.name, patientInfo.formattedName);

          let interpretation = null;
          const nameLower = patientInfo.name.toLowerCase();
          const nameFormatted = patientInfo.formattedName.toLowerCase();

          if (interpretations.has(nameLower)) interpretation = interpretations.get(nameLower);
          else if (interpretations.has(nameFormatted)) interpretation = interpretations.get(nameFormatted);
          else {
            for (const [key, value] of interpretations.entries()) {
              const keyLower = key.toLowerCase();
              if (keyLower.includes(nameLower) || nameLower.includes(keyLower)) {
                interpretation = value; break;
              }
              const patientWords = nameLower.split(' ');
              const keyWords = keyLower.split(' ');
              let matchCount = 0;
              for (const pWord of patientWords) {
                for (const kWord of keyWords) {
                  if (pWord === kWord || pWord.includes(kWord) || kWord.includes(pWord)) {
                    matchCount++; break;
                  }
                }
              }
              if (matchCount >= Math.min(patientWords.length, keyWords.length) / 2) {
                interpretation = value; break;
              }
            }
          }

          if (!interpretation) {
            results.push({ success: false, message: `✗ No interpretation for "${patientInfo.formattedName}"`, fileName: pdfFile.name, patientName: patientInfo.formattedName });
            continue;
          }

          const updatedPdfBytes = await addInterpretationToPDF(pdfUint8, interpretation, patientInfo.formattedName);
          const pdfBlob = new Blob([updatedPdfBytes], { type: 'application/pdf' });
          results.push({
            success: true,
            message: `✓ Added interpretation for ${patientInfo.formattedName}`,
            pdfBlob,
            fileName: `interpreted_${pdfFile.name}`,
            patientName: patientInfo.formattedName,
            interpretation,
          });
        } catch (err: any) {
          results.push({ success: false, message: `✗ Error: ${err.message}`, fileName: pdfFile.name });
        }
      }
      return results;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processInterpretation,
    processMultipleInterpretations,
    isProcessing,
    error,
    extractNameFromFilename,
  };
}