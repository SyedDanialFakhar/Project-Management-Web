import { CheckCircle2, Download, Loader2, AlertCircle, FileText, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TEMPLATES } from '@/lib/templateRegistry';
import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';

export type BatchLetter = {
  id: string;
  transcriptPart: string;
  data: ExtractedLetterData | null;
  status: 'pending' | 'extracting' | 'ready' | 'error';
  error?: string;
};

interface Props {
  letters: BatchLetter[];
  onDownloadOne: (letter: BatchLetter) => void;
  onDownloadAll: () => void;
  onReview: (letter: BatchLetter) => void;
  isDownloadingAll: boolean;
}

export function BatchLetterList({
  letters, onDownloadOne, onDownloadAll, onReview, isDownloadingAll,
}: Props) {
  const readyCount    = letters.filter((l) => l.status === 'ready').length;
  const allReady      = letters.length > 0 && readyCount === letters.length;
  const progress      = letters.length > 0 ? (readyCount / letters.length) * 100 : 0;

  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Patients',  value: letters.length,  color: 'text-foreground' },
          { label: 'Ready',           value: readyCount,       color: 'text-green-600 dark:text-green-400' },
          { label: 'Processing',      value: letters.filter((l) => l.status === 'extracting' || l.status === 'pending').length, color: 'text-primary' },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3 rounded-xl bg-muted/20 border border-border/40 text-center">
            <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
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

      {/* Download all */}
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
            className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0 flex-shrink-0"
          >
            {isDownloadingAll
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Package className="h-3.5 w-3.5" />
            }
            {isDownloadingAll ? 'Preparing ZIP...' : 'Download All (.zip)'}
          </Button>
        </div>
      )}

      {/* Letter cards */}
      <div className="flex flex-col gap-3">
        {letters.map((letter, i) => {
          const templateId = letter.data?.templateId;
          const templateConfig = templateId ? TEMPLATES[templateId] : null;

          return (
            <div
              key={letter.id}
              className={cn(
                'flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200',
                letter.status === 'ready'      && 'border-green-500/20 bg-green-500/5',
                letter.status === 'extracting' && 'border-primary/20 bg-primary/5',
                letter.status === 'error'      && 'border-destructive/20 bg-destructive/5',
                letter.status === 'pending'    && 'border-border/40 bg-muted/5 opacity-60',
              )}
            >
              {/* Number + status icon */}
              <div className="flex-shrink-0">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                  letter.status === 'ready'      && 'bg-green-500/20 text-green-600',
                  letter.status === 'extracting' && 'bg-primary/20 text-primary',
                  letter.status === 'error'      && 'bg-destructive/20 text-destructive',
                  letter.status === 'pending'    && 'bg-muted/40 text-muted-foreground',
                )}>
                  {letter.status === 'ready'      && <CheckCircle2 className="h-4 w-4" />}
                  {letter.status === 'extracting' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {letter.status === 'error'      && <AlertCircle className="h-4 w-4" />}
                  {letter.status === 'pending'    && <span>{i + 1}</span>}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {letter.data?.patientName || `Patient ${i + 1}`}
                  </p>
                  {/* Template badge — shows which doctor's template was auto-detected */}
                  {templateConfig && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <Sparkles className="h-2.5 w-2.5" />
                      {templateConfig.doctorName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {letter.status === 'ready' && letter.data && (
                    <>
                      <span>{letter.data.patientDOB}</span>
                      <span>·</span>
                      <span className="truncate">{letter.data.referringDoctorName}</span>
                      <span>·</span>
                      <span>{letter.data.date}</span>
                    </>
                  )}
                  {letter.status === 'extracting' && <span className="text-primary">Extracting data from transcript...</span>}
                  {letter.status === 'pending'    && <span>Waiting in queue...</span>}
                  {letter.status === 'error'      && <span className="text-destructive">{letter.error}</span>}
                </div>
              </div>

              {/* Actions */}
              {letter.status === 'ready' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => onReview(letter)}
                  >
                    <FileText className="h-3 w-3" />
                    Review & Edit
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0"
                    onClick={() => onDownloadOne(letter)}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}