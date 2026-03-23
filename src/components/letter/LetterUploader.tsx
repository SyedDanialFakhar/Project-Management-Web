import { useRef, useState } from 'react';
import { Upload, FileText, ClipboardPaste, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LetterUploaderProps {
  onTranscriptLoaded: (text: string, fileName: string) => void;
}

export function LetterUploader({ onTranscriptLoaded }: LetterUploaderProps) {
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
        if (!text.trim()) throw new Error('File is empty.');
        onTranscriptLoaded(text, file.name);

      } else if (ext === 'docx') {
        // ✅ Read as ArrayBuffer first — faster and more reliable
        const arrayBuffer = await file.arrayBuffer();

        // ✅ Dynamic import with explicit error catch
        let mammoth: any;
        try {
          mammoth = await import('mammoth');
        } catch {
          throw new Error('Could not load file reader. Try refreshing the page.');
        }

        // ✅ extractRawText is simpler and faster than convertToHtml
        const result = await mammoth.extractRawText({ arrayBuffer });

        if (!result || !result.value || !result.value.trim()) {
          throw new Error('Could not read text from this file. Try copying the text and using Paste Text instead.');
        }

        onTranscriptLoaded(result.value.trim(), file.name);

      } else {
        throw new Error('Please upload a .docx or .txt file only.');
      }

    } catch (err: any) {
      console.error('File read error:', err);
      setReadError(err.message || 'Failed to read file. Try using Paste Text instead.');
    } finally {
      setIsReading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    onTranscriptLoaded(pasteText.trim(), 'transcript.txt');
    setPasteText('');
  }

  return (
    <div className="space-y-5">

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: '1', label: 'Upload Transcript', desc: 'Raw dictation or typed notes', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { num: '2', label: 'AI Extracts Data',  desc: 'Structures all patient info',  color: 'text-primary',  bg: 'bg-primary/10'  },
          { num: '3', label: 'Download Letter',   desc: 'Formatted .docx ready to send', color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map(item => (
          <div key={item.num} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/40 text-center">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold', item.bg, item.color)}>
              {item.num}
            </div>
            <p className="text-xs font-semibold text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
        {[
          { id: 'paste',  label: 'Paste Transcript', icon: ClipboardPaste, badge: 'Recommended' },
          { id: 'upload', label: 'Upload File',       icon: Upload,         badge: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setReadError(null); }}
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
            placeholder={`Paste the doctor's dictation transcript here...\n\nExample:\n"This is Sarah dictating on the 8th of April for Kim Stolke, date of birth 4th October 1982. Please see this letter to Dr Hussein Ibrahim at Boronia Medical Centre..."`}
            rows={14}
            className="w-full resize-none rounded-2xl border border-border/60 bg-muted/10 p-5 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans placeholder:text-muted-foreground/40 transition-all"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {pasteText.trim()
                ? `${pasteText.trim().split(/\s+/).filter(Boolean).length} words`
                : 'No text yet'}
            </p>
            <Button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className="gap-2"
            >
              <FileText className="h-3.5 w-3.5" />
              Use This Transcript
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
              'flex flex-col items-center justify-center gap-5 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
              isDragging  ? 'border-primary bg-primary/5 scale-[1.01]'
                          : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20',
              isReading && 'pointer-events-none opacity-70'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".docx,.txt"
              className="hidden"
              onChange={handleChange}
            />

            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              {isReading
                ? <div className="h-6 w-6 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
                : <Upload className="h-6 w-6 text-primary" />
              }
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isReading ? 'Reading your file...' : 'Drop your file here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or <span className="text-primary font-medium">click to browse</span> — .docx or .txt
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

          {/* Tip */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Tip:</span> If upload gets stuck, use the Paste Transcript tab instead — copy all text from your Word doc (Ctrl+A → Ctrl+C) and paste it there.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {readError && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>{readError}</p>
            <p className="text-xs mt-1 text-destructive/70">
              Try switching to <button onClick={() => setActiveTab('paste')} className="underline font-medium">Paste Transcript</button> tab instead.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}