import { Loader2, CheckCircle2 } from 'lucide-react';

interface BatchProgressProps {
  total: number;
  completed: number;
  errors: number;
}

export function BatchProgress({ total, completed, errors }: BatchProgressProps) {
  const progress = (completed / total) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Processing {completed} of {total} patients
          {errors > 0 && ` (${errors} errors)`}
        </span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}