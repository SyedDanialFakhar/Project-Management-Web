import { useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterpretationFileUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
}

export function InterpretationFileUploader({ onFileSelect, selectedFile }: InterpretationFileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.docx'))) {
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const clearFile = () => {
    onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Interpretations File (.txt or .docx)</label>
      
      {selectedFile ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={clearFile}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
            isDragging ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/10 hover:border-primary/40'
          )}
          onClick={() => document.getElementById('interpretations-upload')?.click()}
        >
          <input
            id="interpretations-upload"
            type="file"
            accept=".txt,.docx"
            className="hidden"
            onChange={handleChange}
          />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Click or drag and drop
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            .txt or .docx files only
          </p>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            <span>File should contain patient names followed by interpretation text</span>
          </div>
        </div>
      )}
    </div>
  );
}