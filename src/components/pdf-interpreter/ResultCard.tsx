import { CheckCircle2, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  success: boolean;
  message: string;
  pdfBlob?: Blob;
  fileName?: string;
  patientName?: string;
  onDownload?: () => void;
}

export function ResultCard({ success, message, pdfBlob, fileName, patientName, onDownload }: ResultCardProps) {
  const handleDownload = () => {
    if (pdfBlob && fileName) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      onDownload?.();
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
    )}>
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={cn(
            'text-sm',
            success ? 'text-green-600' : 'text-red-600'
          )}>
            {message}
          </p>
          {patientName && (
            <p className="text-xs text-muted-foreground mt-1">
              Patient: {patientName}
            </p>
          )}
          {success && pdfBlob && (
            <Button
              onClick={handleDownload}
              size="sm"
              className="mt-3 gap-2"
              variant="outline"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}