import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';

export async function generateDocxBlob(data: ExtractedLetterData): Promise<Blob> {
  const res = await fetch('/LETTER_TEMPLATE_FINAL.docx');
  if (!res.ok) throw new Error('Template not found in public/ folder.');
  const buffer = await res.arrayBuffer();

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,  // ✅ This makes each array item its own paragraph/bullet
    linebreaks: true,
  });

  // ✅ Each section is an array of objects with {item} key
  // paragraphLoop: true means each {item} becomes its own bullet line
  doc.render({
    referringDoctorName:    data.referringDoctorName,
    referringDoctorClinic:  data.referringDoctorClinic,
    referringDoctorAddress: data.referringDoctorAddress,
    date:                   data.date,
    patientName:            data.patientName,
    patientDOB:             data.patientDOB,
    patientContact:         data.patientContact || '',
    patientAddress:         data.patientAddress || '',
    salutation:             data.salutation,
    pmhx:          data.pmhx.filter(Boolean).map(item => ({ item: item.trim() })),
    medications:   data.medications.filter(Boolean).map(item => ({ item: item.trim() })),
    allergies:     data.allergies.filter(Boolean).map(item => ({ item: item.trim() })),
    socialHistory: data.socialHistory.filter(Boolean).map(item => ({ item: item.trim() })),
    body:          data.body,
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