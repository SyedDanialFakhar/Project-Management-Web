import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';

// Cache templates
const templateCache: Record<string, ArrayBuffer> = {};

async function getTemplate(filename: string): Promise<ArrayBuffer> {
  if (templateCache[filename]) return templateCache[filename];

  const res = await fetch(`/${filename}`);
  if (!res.ok) throw new Error(`Template ${filename} not found`);

  const buffer = await res.arrayBuffer();
  templateCache[filename] = buffer;
  return buffer;
}

// ✅ BUILD PARAGRAPH FOR SENTHURAN
function buildSenthuranBody(data: ExtractedLetterData) {
  const parts: string[] = [];

  if (data.body) parts.push(data.body.trim());

  if (data.pmhx?.length) {
    parts.push(`Past medical history includes ${data.pmhx.join(', ')}.`);
  }

  if (data.medications?.length) {
    parts.push(`Medications include ${data.medications.join(', ')}.`);
  }

  if (data.allergies?.length) {
    parts.push(`He has no known drug allergies.`);
  }

  if (data.socialHistory?.length) {
    parts.push(`Social history: ${data.socialHistory.join(', ')}.`);
  }

  if (data.plan?.length) {
    parts.push(`Plan is to ${data.plan.join(', ')}.`);
  }

  return parts.join('\n\n');
}

export async function generateDocxBlob(
  data: ExtractedLetterData,
  templateFilename: string
): Promise<Blob> {

  const buffer = await getTemplate(templateFilename);

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const isSenthuran = templateFilename.includes('SENTHURAN');

  const filterEmpty = (arr: string[]) =>
    arr.filter(item => item && item.trim());

  doc.render({
    referringDoctorName: data.referringDoctorName || '',
    referringDoctorClinic: data.referringDoctorClinic || '',
    referringDoctorAddress: data.referringDoctorAddress || '',
    date: data.date || '',
    patientName: data.patientName || '',
    patientDOB: data.patientDOB || '',
    patientContact: data.patientContact || '',
    patientAddress: data.patientAddress || '',
    salutation: data.salutation || '',

    // ✅ KEY CHANGE
    body: isSenthuran
      ? buildSenthuranBody(data)
      : data.body || '',

    // Only used in Sarah template
    pmhx: filterEmpty(data.pmhx || []).map(item => ({ item })),
    medications: filterEmpty(data.medications || []).map(item => ({ item })),
    allergies: filterEmpty(data.allergies || []).map(item => ({ item })),
    socialHistory: filterEmpty(data.socialHistory || []).map(item => ({ item })),
    plan: filterEmpty(data.plan || []).map(item => ({ item })),
  });

  return doc.getZip().generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export async function downloadLetter(
  data: ExtractedLetterData,
  fileName: string,
  templateFilename: string
) {
  const blob = await generateDocxBlob(data, templateFilename);
  saveAs(blob, fileName);
}