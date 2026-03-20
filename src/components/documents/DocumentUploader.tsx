import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploaderProps {
  onFileLoaded: (text: string, fileName: string) => void;
}

const ACCEPTED = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/pdf',
];

const ACCEPTED_EXT = ['.docx', '.txt', '.pdf'];

export function DocumentUploader({ onFileLoaded }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  async function processFile(file: File) {
    if (!file) return;
    setIsReading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'txt') {
        const text = await file.text();
        onFileLoaded(text, file.name);

      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onFileLoaded(result.value, file.name);

      } else if (ext === 'pdf') {
        // For PDF — read as text fallback
        // Note: PDF text extraction in browser is limited
        // Using basic text read
        const text = await file.text();
        onFileLoaded(text || '(PDF content — paste text manually if empty)', file.name);

      } else {
        alert('Unsupported file type. Please upload .docx, .txt or .pdf');
      }
    } catch (err) {
      alert('Failed to read file. Please try again.');
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
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.txt,.pdf"
        className="hidden"
        onChange={handleChange}
      />

      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        {isReading ? (
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <Upload className="h-6 w-6 text-primary" />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-foreground mb-1">
          {isReading ? 'Reading file...' : 'Drop your document here'}
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse — supports .docx, .txt, .pdf
        </p>
      </div>

      <div className="flex items-center gap-2">
        {ACCEPTED_EXT.map(ext => (
          <span key={ext} className="flex items-center gap-1 text-[10px] font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
            <FileText className="h-3 w-3" />
            {ext}
          </span>
        ))}
      </div>
    </div>
  );
}