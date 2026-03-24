import { FileText } from 'lucide-react';

interface Props {
  totalFound: number;
}

export function BatchSplittingView({ totalFound }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-6 px-8">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">
            {totalFound > 0
              ? `Found ${totalFound} patients — extracting letters...`
              : 'AI is reading the transcript...'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Splitting into individual patient dictations and generating each letter
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {['Splitting Patients', 'Extracting Data', 'Generating Letters'].map((item, i) => (
            <span
              key={item}
              className="text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}