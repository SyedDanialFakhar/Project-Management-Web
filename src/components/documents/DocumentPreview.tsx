interface DocumentPreviewProps {
    title: string;
    text: string;
    badge?: string;
    badgeColor?: string;
  }
  
  export function DocumentPreview({ title, text, badge, badgeColor = 'bg-muted text-muted-foreground' }: DocumentPreviewProps) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          {badge && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-4 no-scrollbar">
          <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
            {text || <span className="text-muted-foreground italic">No content yet...</span>}
          </pre>
        </div>
      </div>
    );
  }