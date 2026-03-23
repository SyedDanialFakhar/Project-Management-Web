import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'input',      label: 'Transcript' },
  { id: 'extracting', label: 'Extracting'  },
  { id: 'review',     label: 'Review'      },
  { id: 'done',       label: 'Done'        },
];

export function LetterStepIndicator({ step }: { step: string }) {
  const stepIndex = STEPS.findIndex(s => s.id === step);
  return (
    <div className="hidden md:flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            stepIndex === i ? 'bg-primary text-primary-foreground' :
            stepIndex > i  ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                             'bg-muted/40 text-muted-foreground'
          )}>
            {stepIndex > i
              ? <CheckCircle2 className="h-3 w-3" />
              : <span className="h-3.5 w-3.5 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
            }
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px w-4', stepIndex > i ? 'bg-green-500/40' : 'bg-border/40')} />
          )}
        </div>
      ))}
    </div>
  );
}