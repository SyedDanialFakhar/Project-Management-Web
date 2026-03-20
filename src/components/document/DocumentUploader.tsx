import { useRef, useState } from 'react';
import { Upload, FileText, ClipboardPaste, AlertTriangle, Sparkles, Pencil, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DocumentUploaderProps {
  onFileLoaded: (text: string, fileName: string) => void;
}

export function DocumentUploader({ onFileLoaded }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [pasteText, setPasteText] = useState('');

  async function processFile(file: File) {
    if (!file) return;
    setIsReading(true);
    setReadError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'txt') {
        const text = await file.text();
        onFileLoaded(text, file.name);
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) throw new Error('Could not extract text. Try copying text from Word and using Paste Text.');
        onFileLoaded(result.value, file.name);
      } else {
        setReadError('Please upload .docx or .txt. For PDFs, copy the text and use Paste Text.');
      }
    } catch (err: any) {
      setReadError(err.message || 'Failed to read file.');
    } finally {
      setIsReading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    onFileLoaded(pasteText.trim(), 'pasted-text.txt');
    setPasteText('');
  }

  const wordCount = pasteText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">

      {/* Hero section */}
      <div className="text-center space-y-2 py-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Fix Your Document</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Paste or upload your text and AI will automatically fix grammar, spelling and punctuation mistakes
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: ClipboardPaste, label: 'Paste or Upload', desc: 'Add your text', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: Sparkles,       label: 'AI Fixes It',     desc: 'Auto correction', color: 'text-primary',  bg: 'bg-primary/10' },
          { icon: Download,       label: 'Download',         desc: '.docx or .txt',  color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/40 text-center">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', item.bg)}>
              <item.icon className={cn('h-4 w-4', item.color)} />
            </div>
            <p className="text-xs font-semibold text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
        {[
          { id: 'paste',  label: 'Paste Text',  icon: ClipboardPaste, badge: 'Recommended' },
          { id: 'upload', label: 'Upload File',  icon: Upload,         badge: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.badge && (
              <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Paste tab */}
      {activeTab === 'paste' && (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Paste your text here...\n\nTip: Works great with text from:\n  • Word documents — Ctrl+A then Copy\n  • PDF files — Ctrl+A then Copy\n  • Emails, notes, or anything else`}
            rows={14}
            className="w-full resize-none rounded-2xl border border-border/60 bg-muted/10 p-5 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-sans placeholder:text-muted-foreground/40 transition-all"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {pasteText.trim() ? (
                <span className="flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>{pasteText.length} characters</span>
                </span>
              ) : 'No text yet'}
            </p>
            <Button onClick={handlePasteSubmit} disabled={!pasteText.trim()} className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Use This Text
            </Button>
          </div>
        </div>
      )}

      {/* Upload tab */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isReading && inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-5 p-14 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20',
              isReading && 'pointer-events-none opacity-70'
            )}
          >
            <input ref={inputRef} type="file" accept=".docx,.txt" className="hidden" onChange={handleChange} />
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {isReading
                ? <div className="h-7 w-7 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
                : <Upload className="h-7 w-7 text-primary" />
              }
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                {isReading ? 'Reading your document...' : 'Drop your file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or <span className="text-primary font-medium">click to browse</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {[{ ext: '.docx', note: 'text extracted' }, { ext: '.txt', note: 'full support' }].map(f => (
                <div key={f.ext} className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-full text-muted-foreground border border-border/40">
                    <FileText className="h-3 w-3" />
                    {f.ext}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">{f.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Word users:</span> Uploading extracts plain text only — original fonts and formatting won't be preserved. For best results, copy text from Word and use Paste Text tab.
            </p>
          </div>
        </div>
      )}

      {readError && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {readError}
        </div>
      )}
    </div>
  );
}