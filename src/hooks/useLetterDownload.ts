import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';

async function generateDocxBlob(data: ExtractedLetterData): Promise<Blob> {
  const res = await fetch('/LETTER_TEMPLATE_FINAL.docx');
  if (!res.ok) throw new Error('Template not found in public/ folder.');
  const buffer = await res.arrayBuffer();

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

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
    pmhx:          data.pmhx.map(item => ({ item })),
    medications:   data.medications.map(item => ({ item })),
    allergies:     data.allergies.map(item => ({ item })),
    socialHistory: data.socialHistory.map(item => ({ item })),
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
  format: 'docx' | 'pdf' = 'docx'
) {
  const docxBlob = await generateDocxBlob(data);
  const baseName = fileName.replace(/\.docx$/i, '');

  if (format === 'docx') {
    // ✅ Direct .docx download
    saveAs(docxBlob, `${baseName}.docx`);

  } else {
    // ✅ Open .docx in new tab → user presses Ctrl+P → Save as PDF
    // The browser renders it as a Word document — user saves as PDF
    const url = URL.createObjectURL(docxBlob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback if popup blocked — just download the docx
      saveAs(docxBlob, `${baseName}.docx`);
      alert('Popup was blocked. Downloaded as .docx instead. Open it in Word and Save As PDF.');
      return;
    }
    // Clean up the object URL after 60 seconds
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}