import {
  CheckCircle2,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';

export type BatchLetter = {
  id: string;
  transcriptPart: string;
  data: ExtractedLetterData | null;
  status: 'pending' | 'extracting' | 'ready' | 'error';
  error?: string;
};

interface TemplateOption {
  label: string;
  value: string;
}

interface Props {
  letters: BatchLetter[];

  selectedTemplate: string;
  templates: TemplateOption[];
  detectedDoctor?: string;
  onTemplateChange: (value: string) => void;

  onDownloadOne: (letter: BatchLetter) => void;
  onDownloadAll: () => void;
  onReview: (letter: BatchLetter) => void;
  isDownloadingAll: boolean;
}

export function BatchLetterList({
  letters,

  selectedTemplate,
  templates,
  detectedDoctor,
  onTemplateChange,

  onDownloadOne,
  onDownloadAll,
  onReview,
  isDownloadingAll
}: Props) {

  const readyCount = letters.filter(l => l.status === 'ready').length;
  const allReady = letters.length > 0 && readyCount === letters.length;
  const progress = letters.length > 0 ? (readyCount / letters.length) * 100 : 0;

  return (
    <div className="space-y-5">

      {/* ✅ Template + detected doctor */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div>
          <p className="text-sm font-medium">
            {detectedDoctor
              ? `Detected Doctor: ${detectedDoctor}`
              : 'Template Selection'}
          </p>
          <p className="text-xs text-muted-foreground">
            Same template will be used for all letters
          </p>
        </div>

        <select
          value={selectedTemplate}
          onChange={(e) => onTemplateChange(e.target.value)}
          className="h-9 rounded-lg border border-border/60 bg-background text-xs px-3"
        >
          {templates.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Patients', value: letters.length, color: 'text-foreground' },
          { label: 'Ready', value: readyCount, color: 'text-green-600 dark:text-green-400' },
          {
            label: 'Processing',
            value: letters.filter(l => l.status === 'extracting' || l.status === 'pending').length,
            color: 'text-primary'
          },
        ].map(stat => (
          <div key={stat.label} className="px-4 py-3 rounded-xl bg-muted/20 border border-border/40 text-center">
            <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Download All */}
      {allReady && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              All {letters.length} letters ready!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download individually or all at once as ZIP
            </p>
          </div>

          <Button
            onClick={onDownloadAll}
            disabled={isDownloadingAll}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
          >
            {isDownloadingAll
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Package className="h-3.5 w-3.5" />
            }
            {isDownloadingAll ? 'Preparing ZIP...' : 'Download All'}
          </Button>
        </div>
      )}

      {/* Letter list */}
      <div className="flex flex-col gap-3">
        {letters.map((letter, i) => (
          <div
            key={letter.id}
            className={cn(
              'flex items-center gap-4 px-5 py-4 rounded-xl border',
              letter.status === 'ready' && 'border-green-500/20 bg-green-500/5',
              letter.status === 'extracting' && 'border-primary/20 bg-primary/5',
              letter.status === 'error' && 'border-destructive/20 bg-destructive/5',
              letter.status === 'pending' && 'border-border/40 bg-muted/5 opacity-60'
            )}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {letter.data?.patientName || `Patient ${i + 1}`}
              </p>
            </div>

            {letter.status === 'ready' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onReview(letter)}>
                  <FileText className="h-3 w-3 mr-1" />
                  Review
                </Button>
                <Button size="sm" onClick={() => onDownloadOne(letter)}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}