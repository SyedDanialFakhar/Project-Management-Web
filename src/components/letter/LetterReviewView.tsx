import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterDataPreview } from './LetterDataPreview';
import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';

interface TemplateOption {
  label: string;
  value: string;
}

interface Props {
  data: ExtractedLetterData;
  isDownloading: boolean;
  hasTranscript: boolean;

  selectedTemplate: string;
  templates: TemplateOption[];
  detectedDoctor?: string;
  onTemplateChange: (value: string) => void;

  onChange: (data: ExtractedLetterData) => void;
  onDownload: () => void;
  onReExtract: () => void;
  onReset: () => void;
}

export function LetterReviewView({
  data,
  isDownloading,
  hasTranscript,

  selectedTemplate,
  templates,
  detectedDoctor,
  onTemplateChange,

  onChange,
  onDownload,
  onReExtract,
  onReset,
}: Props) {
  return (
    <div className="space-y-5">

      {/* Success message */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          Data extracted! Review and edit below, then download.
        </p>
      </div>

      {/* ✅ Detected doctor info */}
      {detectedDoctor && (
        <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm">
            <span className="font-medium">Detected Doctor:</span> {detectedDoctor}
          </p>
          <p className="text-xs text-muted-foreground">
            Correct template selected automatically (you can change if needed)
          </p>
        </div>
      )}

      <LetterDataPreview data={data} onChange={onChange} />

      <div className="flex items-center justify-between pt-4 border-t border-border/40">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Template:
            </label>
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

          {hasTranscript && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReExtract}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-extract
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1.5 text-muted-foreground"
          >
            Start Over
          </Button>
        </div>

        {/* DOWNLOAD BUTTON */}
        <Button
          onClick={onDownload}
          disabled={isDownloading}
          className="gap-2 px-6 bg-green-600 hover:bg-green-700 text-white border-0"
        >
          {isDownloading ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download .docx
        </Button>
      </div>
    </div>
  );
}