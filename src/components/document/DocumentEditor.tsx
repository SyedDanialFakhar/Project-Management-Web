import { Pencil, Lightbulb, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface DocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function parseFixedText(raw: string): { fixed: string; suggestions: string[] } {
  const parts = raw.split('--- SUGGESTIONS ---');
  const fixed = parts[0].trim();
  const suggestions = parts[1]
    ? parts[1].trim().split('\n').map(s => s.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
    : [];
  return { fixed, suggestions };
}

export function DocumentEditor({ value, onChange }: DocumentEditorProps) {
  const { fixed, suggestions } = parseFixedText(value);
  const [copied, setCopied] = useState(false);

  function handleChange(newFixed: string) {
    if (suggestions.length > 0) {
      onChange(`${newFixed}\n\n--- SUGGESTIONS ---\n${suggestions.map(s => `• ${s}`).join('\n')}`);
    } else {
      onChange(newFixed);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(fixed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full gap-3 min-h-[300px]">
      {/* Editor */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fixed Version</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              ✓ Fixed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              Editable
            </span>
          </div>
        </div>
        <textarea
          value={fixed}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 resize-none rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 font-sans"
          placeholder="Fixed document will appear here..."
          spellCheck
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex-shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Writing Suggestions
            </p>
          </div>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}