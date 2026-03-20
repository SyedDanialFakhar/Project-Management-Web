import { Pencil } from 'lucide-react';

interface DocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DocumentEditor({ value, onChange }: DocumentEditorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Pencil className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Edit Fixed Version
        </p>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary ml-auto">
          Editable
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans no-scrollbar"
        placeholder="Fixed document will appear here. You can edit it before downloading..."
        spellCheck
      />
    </div>
  );
}