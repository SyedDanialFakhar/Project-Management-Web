import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';

export async function downloadLetter(
  data: ExtractedLetterData,
  fileName: string,
  format: 'docx' | 'pdf' = 'docx'
) {
  // ✅ Load the modified template from public folder
  const res = await fetch('/LETTER_TEMPLATE_FINAL.docx');
  if (!res.ok) throw new Error('Template file not found in public folder');
  const buffer = await res.arrayBuffer();

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // ✅ Fill all placeholders
  doc.render({
    referringDoctorName: data.referringDoctorName,
    referringDoctorClinic: data.referringDoctorClinic,
    referringDoctorAddress: data.referringDoctorAddress,
    date: data.date,
    patientName: data.patientName,
    patientDOB: data.patientDOB,
    patientContact: data.patientContact || '',
    patientAddress: data.patientAddress || '',
    salutation: data.salutation,
    pmhx: data.pmhx.map(item => ({ item })),
    medications: data.medications.map(item => ({ item })),
    allergies: data.allergies.map(item => ({ item })),
    socialHistory: data.socialHistory.map(item => ({ item })),
    body: data.body,
    plan: data.plan.filter(Boolean).map(item => ({ item })),
  });

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  if (format === 'pdf') {
    // Open in new tab for print-to-PDF
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.onload = () => win.print();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else {
    saveAs(blob, fileName);
  }
}