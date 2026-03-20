import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface DocumentPreviewProps {
  title: string;
  text: string;
  badge?: string;
  badgeColor?: string;
}

export function DocumentPreview({ title, text, badge, badgeColor = 'bg-muted text-muted-foreground' }: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-5">
        {text ? (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">{text}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No content yet...</p>
        )}
      </div>
    </div>
  );
}