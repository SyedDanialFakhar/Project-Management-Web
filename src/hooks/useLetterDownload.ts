import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ExtractedLetterData } from './useLetterGenerator';

export async function downloadLetter(
  data: ExtractedLetterData,
  fileName: string,
  format: 'docx' | 'pdf' = 'docx'
) {
  const res = await fetch('/LETTER_TEMPLATE_FINAL.docx');
  if (!res.ok) throw new Error('Template not found in public/ folder.');
  const buffer = await res.arrayBuffer();

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

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
    // ✅ Plan removed — not in the actual letter format
  });

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  if (format === 'docx') {
    saveAs(blob, fileName);

  } else if (format === 'pdf') {
    // ✅ Proper PDF — convert docx blob to printable HTML and trigger print-to-PDF
    const mammoth = await import('mammoth');
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });

    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Popup blocked. Please allow popups for this site.');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName.replace('.docx', '')}</title>
          <style>
            @page { margin: 2cm; }
            body {
              font-family: Aptos, Calibri, Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #1a1a1a;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            p { margin: 6px 0; }
            ul { margin: 4px 0; padding-left: 24px; }
            li { margin: 2px 0; }
            b, strong { font-weight: 600; }
          </style>
        </head>
        <body>
          ${result.value}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}