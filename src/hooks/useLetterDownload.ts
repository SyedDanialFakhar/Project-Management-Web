import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '@/lib/templateRegistry';

// ── Template cache (one entry per template file) ──────────────────────────────
const templateCache = new Map<string, ArrayBuffer>();
const templatePromises = new Map<string, Promise<ArrayBuffer>>();

async function getTemplate(filePath: string): Promise<ArrayBuffer> {
  if (templateCache.has(filePath)) return templateCache.get(filePath)!;
  if (templatePromises.has(filePath)) return templatePromises.get(filePath)!;

  const promise = (async () => {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Template not found: ${filePath}`);
    const buffer = await res.arrayBuffer();
    templateCache.set(filePath, buffer);
    templatePromises.delete(filePath);
    return buffer;
  })();

  templatePromises.set(filePath, promise);
  return promise;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const filterEmpty = (arr: string[]) => arr.filter((item) => item && item.trim());

// ── Main blob generator ───────────────────────────────────────────────────────
export async function generateDocxBlob(data: ExtractedLetterData): Promise<Blob> {
  // Pick the right template file based on templateId (fall back to default)
  const templateId = data.templateId ?? DEFAULT_TEMPLATE_ID;
  const config = TEMPLATES[templateId] ?? TEMPLATES[DEFAULT_TEMPLATE_ID];
  const buffer = await getTemplate(config.file);

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  if (templateId === 'senthuran') {
    // ── Dr Senthuran's template: simple flat fields only ──────────────────────
    doc.render({
      referringDoctorName:    data.referringDoctorName    || '',
      referringDoctorClinic:  data.referringDoctorClinic  || '',
      referringDoctorAddress: data.referringDoctorAddress || '',
      date:                   data.date                   || '',
      patientName:            data.patientName            || '',
      patientDOB:             data.patientDOB             || '',
      patientContact:         data.patientContact         || '',
      patientAddress:         data.patientAddress         || '',
      salutation:             data.salutation             || '',
      body:                   data.body                   || '',
    });
  } else {
    // ── Dr Sarah's template: includes bullet-list loop sections ───────────────
    doc.render({
      referringDoctorName:    data.referringDoctorName    || '',
      referringDoctorClinic:  data.referringDoctorClinic  || '',
      referringDoctorAddress: data.referringDoctorAddress || '',
      date:                   data.date                   || '',
      patientName:            data.patientName            || '',
      patientDOB:             data.patientDOB             || '',
      patientContact:         data.patientContact         || '',
      patientAddress:         data.patientAddress         || '',
      salutation:             data.salutation             || '',
      pmhx:          filterEmpty(data.pmhx          || []).map((item) => ({ item: item.trim() })),
      medications:   filterEmpty(data.medications   || []).map((item) => ({ item: item.trim() })),
      allergies:     filterEmpty(data.allergies     || []).map((item) => ({ item: item.trim() })),
      socialHistory: filterEmpty(data.socialHistory || []).map((item) => ({ item: item.trim() })),
      body:          data.body || '',
    });
  }

  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

// ── Download helper ───────────────────────────────────────────────────────────
export async function downloadLetter(data: ExtractedLetterData, fileName: string) {
  const blob = await generateDocxBlob(data);
  saveAs(blob, fileName);
}