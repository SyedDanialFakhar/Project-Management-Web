import { CheckCircle2, FileText, RotateCcw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  patientName: string;
  onBackToReview: () => void;
  onReset: () => void;
  onViewHistory: () => void;
}

export function LetterDoneView({ patientName, onBackToReview, onReset, onViewHistory }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-6 px-8 max-w-md">
        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">Letter Downloaded!</p>
          <p className="text-sm text-muted-foreground mt-2">
            Saved to history for{' '}
            <span className="font-semibold text-foreground">{patientName}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onBackToReview} variant="outline" className="gap-2">
            <FileText className="h-3.5 w-3.5" />
            Back to Review
          </Button>
          <Button onClick={onReset} variant="ghost" className="gap-2 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Generate Another Letter
          </Button>
          <Button onClick={onViewHistory} variant="ghost" className="gap-2 text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            View History
          </Button>
        </div>
      </div>
    </div>
  );
}