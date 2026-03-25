interface ProgressBarProps {
    current: number;
    total: number;
    currentFile?: string;
  }
  
  export function ProgressBar({ current, total, currentFile }: ProgressBarProps) {
    const percentage = (current / total) * 100;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Processing {current} of {total}
          </span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {currentFile && (
          <p className="text-xs text-muted-foreground">
            Current: {currentFile}
          </p>
        )}
      </div>
    );
  }