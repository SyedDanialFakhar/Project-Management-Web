import { useState } from 'react';
import { Download, Sparkles, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
} from 'docx';

interface DocumentActionsProps {
  originalText: string;
  fixedText: string;
  fileName: string;
  isFixing: boolean;
  hasFixed: boolean;
  onFix: () => void;
  onReset: () => void;
}

type DownloadFormat = 'docx' | 'txt' | 'pdf';

export function DocumentActions({
  originalText, fixedText, fileName,
  isFixing, hasFixed, onFix, onReset,
}: DocumentActionsProps) {
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('docx');

  const baseName = fileName.replace(/\.[^/.]+$/, '');

  async function handleDownload() {
    if (!fixedText) return;

    if (downloadFormat === 'txt') {
      const blob = new Blob([fixedText], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${baseName}_fixed.txt`);

    } else if (downloadFormat === 'docx') {
      const paragraphs = fixedText
        .split('\n')
        .map(line => new Paragraph({
          children: [new TextRun({ text: line, size: 24, font: 'Calibri' })],
          spacing: { after: 120 },
        }));

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: baseName,
              heading: HeadingLevel.TITLE,
              spacing: { after: 400 },
            }),
            ...paragraphs,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${baseName}_fixed.docx`);

    } else if (downloadFormat === 'pdf') {
      // PDF via print dialog — browser native
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>${baseName}_fixed</title>
            <style>
              body { font-family: Calibri, sans-serif; font-size: 14px; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <h2>${baseName}</h2>
            <pre>${fixedText}</pre>
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border/40">
      {/* Left — fix + reset */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onFix}
          disabled={!originalText || isFixing}
          className="gap-2"
        >
          {isFixing ? (
            <>
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {hasFixed ? 'Fix Again' : 'Fix with AI'}
            </>
          )}
        </Button>

        {hasFixed && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Right — format picker + download */}
      {hasFixed && (
        <div className="flex items-center gap-2">
          {/* Format selector */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/40">
            {(['docx', 'txt', 'pdf'] as DownloadFormat[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => setDownloadFormat(fmt)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  downloadFormat === fmt
                    ? 'bg-background text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                .{fmt}
              </button>
            ))}
          </div>

          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}