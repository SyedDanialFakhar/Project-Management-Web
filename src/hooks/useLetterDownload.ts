import { saveAs } from 'file-saver';
import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, LevelFormat, UnderlineType,
} from 'docx';
import type { ExtractedLetterData } from './useLetterGenerator';

function bulletList(items: string[]) {
  return items.map(item =>
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun({ text: item, size: 22, font: 'Calibri' })],
    })
  );
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Calibri' })],
  });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
  });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun('')] });
}

export async function downloadLetter(data: ExtractedLetterData, fileName: string) {

  const bodyParagraphs = data.body
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => bodyParagraph(p.trim()));

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '-',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 },
              },
            },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        // Sender header
        new Paragraph({
          children: [new TextRun({ text: 'Dr Sarah Yeo', bold: true, size: 26, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: 'MBBS, FRACP', size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Respiratory & Sleep Specialist', size: 22, font: 'Calibri' })],
        }),
        emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: '4 Wantirna Road, Ringwood, 3134', size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: '1300 780 377', size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: 'admin@respiratoryservice.com.au', size: 22, font: 'Calibri' })],
        }),
        emptyLine(),
        emptyLine(),

        // Recipient
        new Paragraph({
          children: [new TextRun({ text: data.referringDoctorName, size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: data.referringDoctorClinic, size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: data.referringDoctorAddress, size: 22, font: 'Calibri' })],
        }),
        emptyLine(),

        // Date
        new Paragraph({
          children: [new TextRun({ text: data.date, size: 22, font: 'Calibri' })],
        }),
        emptyLine(),

        // RE line
        new Paragraph({
          children: [new TextRun({ text: `RE: ${data.patientName}`, size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `DOB: ${data.patientDOB}`, size: 22, font: 'Calibri' })],
        }),
        ...(data.patientContact ? [new Paragraph({
          children: [new TextRun({ text: `Contact Number: ${data.patientContact}`, size: 22, font: 'Calibri' })],
        })] : []),
        ...(data.patientAddress ? [new Paragraph({
          children: [new TextRun({ text: `Address: ${data.patientAddress}`, size: 22, font: 'Calibri' })],
        })] : []),
        emptyLine(),

        // Salutation
        new Paragraph({
          children: [new TextRun({ text: `Dear ${data.salutation},`, size: 22, font: 'Calibri' })],
        }),
        emptyLine(),

        // PMHx
        sectionHeading('PMHx'),
        ...bulletList(data.pmhx),

        // Medications
        sectionHeading('Medications'),
        ...bulletList(data.medications),

        // Allergies
        sectionHeading('Allergies'),
        ...bulletList(data.allergies),

        // Social History
        sectionHeading('Social History'),
        ...bulletList(data.socialHistory),
        emptyLine(),

        // Body
        ...bodyParagraphs,

        // Plan (only if exists)
        ...(data.plan && data.plan.length > 0 && data.plan[0] !== '' ? [
          emptyLine(),
          sectionHeading('Plan'),
          ...bulletList(data.plan),
        ] : []),

        emptyLine(),

        // Sign off
        new Paragraph({
          children: [new TextRun({ text: 'Thank you for your ongoing care.', size: 22, font: 'Calibri' })],
        }),
        emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: 'Kind Regards,', size: 22, font: 'Calibri' })],
        }),
        emptyLine(),
        emptyLine(),
        emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: 'Electronically Approved by:', size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Dr Sarah Yeo', bold: true, size: 22, font: 'Calibri' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Respiratory & Sleep Physician', size: 22, font: 'Calibri' })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}