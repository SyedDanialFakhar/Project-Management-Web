import { useState } from 'react';
import { Trash2, Eye, Download, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterpretationStore } from '@/hooks/useInterpretationStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface InterpretationHistoryProps {
  onViewInterpretation?: (text: string) => void;
}

export function InterpretationHistory({ onViewInterpretation }: InterpretationHistoryProps) {
  const { interpretationFiles, deleteInterpretationFile } = useInterpretationStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteInterpretationFile.mutateAsync(id);
    setDeletingId(null);
  };

  if (interpretationFiles.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/5">
        <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No interpretations saved yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Processed interpretation files will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Interpretation Files History</h3>
      {interpretationFiles.map((record) => (
        <div
          key={record.id}
          className="rounded-lg border border-border/60 hover:border-primary/30 transition-all overflow-hidden"
        >
          <div className="p-3 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm font-medium truncate">{record.file_name}</p>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">
                  {record.patient_count} patient{record.patient_count !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                {expandedId === record.id ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => handleDelete(record.id)}
                disabled={deletingId === record.id}
                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          </div>
          
          {/* Expanded view showing all interpretations in this file */}
          {expandedId === record.id && (
            <div className="border-t border-border/40 bg-muted/5 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Interpretations:</p>
              {Object.entries(record.interpretations).map(([name, text]) => (
                <div key={name} className="p-2 rounded-lg bg-muted/20 text-xs">
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{text.slice(0, 150)}...</p>
                  {onViewInterpretation && (
                    <button
                      onClick={() => onViewInterpretation(text)}
                      className="mt-2 text-primary text-xs hover:underline"
                    >
                      View full
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}