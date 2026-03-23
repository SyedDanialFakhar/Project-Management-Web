import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LetterDataPreview } from './LetterDataPreview';
import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';
import { cn } from '@/lib/utils';

type DownloadFormat = 'docx' | 'pdf';

interface Props {
  data: ExtractedLetterData;
  isDownloading: boolean;
  hasTranscript: boolean;
  onChange: (data: ExtractedLetterData) => void;
  onDownload: (format: DownloadFormat) => void;
  onReExtract: () => void;
  onReset: () => void;
}

export function LetterReviewView({
  data, isDownloading, hasTranscript,
  onChange, onDownload, onReExtract, onReset,
}: Props) {
  const [format, setFormat] = useState<DownloadFormat>('docx');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          Data extracted! Review and edit below, then download.
        </p>
      </div>

      <LetterDataPreview data={data} onChange={onChange} />

      <div className="flex flex-col gap-3 pt-4 border-t border-border/40">

        {/* PDF hint */}
        {format === 'pdf' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
            ℹ️ PDF opens in a new tab — press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-blue-500/10 font-mono text-[10px]">Ctrl+P</kbd> then select <span className="font-semibold mx-1">Save as PDF</span> to download with full formatting.
          </div>
        )}

        <div className="flex items-center justify-between">
          {/* Left buttons */}
          <div className="flex gap-2">
            {hasTranscript && (
              <Button variant="ghost" size="sm" onClick={onReExtract} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Re-extract
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground">
              Start Over
            </Button>
          </div>

          {/* Right — format + download */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-1 border border-border/40">
              {(['docx', 'pdf'] as DownloadFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                    format === fmt
                      ? 'bg-background text-foreground shadow-sm border border-border/40'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  .{fmt}
                </button>
              ))}
            </div>
            <Button
              onClick={() => onDownload(format)}
              disabled={isDownloading}
              className="gap-2 px-6 bg-green-600 hover:bg-green-700 text-white border-0"
            >
              {isDownloading
                ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <Download className="h-3.5 w-3.5" />
              }
              {format === 'pdf' ? 'Open for PDF' : 'Download'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}