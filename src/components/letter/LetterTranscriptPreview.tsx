import { RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  transcript: string;
  isExtracting: boolean;
  onExtract: () => void;
  onReset: () => void;
}

export function LetterTranscriptPreview({ transcript, isExtracting, onExtract, onReset }: Props) {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-muted/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transcript Preview
          </p>
          <span className="text-xs text-muted-foreground">{wordCount} words</span>
        </div>
        <div className="p-5 max-h-64 overflow-y-auto">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{transcript}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
          Start Over
        </Button>
        <Button onClick={onExtract} disabled={isExtracting} className="gap-2 px-6">
          <Sparkles className="h-3.5 w-3.5" />
          Extract & Generate Letter
        </Button>
      </div>
    </div>
  );
}