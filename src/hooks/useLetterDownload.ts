import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';

// Cache the template to avoid repeated fetches
let cachedTemplate: ArrayBuffer | null = null;
let templatePromise: Promise<ArrayBuffer> | null = null;

async function getTemplate(): Promise<ArrayBuffer> {
  if (cachedTemplate) return cachedTemplate;
  
  if (templatePromise) return templatePromise;
  
  templatePromise = (async () => {
    const res = await fetch('/LETTER_TEMPLATE_FINAL.docx');
    if (!res.ok) throw new Error('Template not found in public/ folder.');
    const buffer = await res.arrayBuffer();
    cachedTemplate = buffer;
    templatePromise = null;
    return buffer;
  })();
  
  return templatePromise;
}

export async function generateDocxBlob(data: ExtractedLetterData): Promise<Blob> {
  const buffer = await getTemplate();

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Filter out empty items
  const filterEmpty = (arr: string[]) => arr.filter(item => item && item.trim());

  doc.render({
    referringDoctorName:    data.referringDoctorName || '',
    referringDoctorClinic:  data.referringDoctorClinic || '',
    referringDoctorAddress: data.referringDoctorAddress || '',
    date:                   data.date || '',
    patientName:            data.patientName || '',
    patientDOB:             data.patientDOB || '',
    patientContact:         data.patientContact || '',
    patientAddress:         data.patientAddress || '',
    salutation:             data.salutation || '',
    pmhx:          filterEmpty(data.pmhx || []).map(item => ({ item: item.trim() })),
    medications:   filterEmpty(data.medications || []).map(item => ({ item: item.trim() })),
    allergies:     filterEmpty(data.allergies || []).map(item => ({ item: item.trim() })),
    socialHistory: filterEmpty(data.socialHistory || []).map(item => ({ item: item.trim() })),
    body:          data.body || '',
  });

  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export async function downloadLetter(
  data: ExtractedLetterData,
  fileName: string,
) {
  const docxBlob = await generateDocxBlob(data);
  saveAs(docxBlob, fileName);
}