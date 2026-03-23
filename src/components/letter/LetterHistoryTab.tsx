import { History, Clock, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';

interface Props {
  history: any[];
  onOpen: (record: any) => void;
  onDelete: (id: string) => void;
}

export function LetterHistoryTab({ history, onOpen, onDelete }: Props) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-foreground">Letter History</h2>
        <span className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/40">
          {history.length} letter{history.length !== 1 ? 's' : ''} saved
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed rounded-2xl bg-muted/5">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <History className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground">No letters saved yet</p>
          <p className="text-xs text-muted-foreground">Generated letters appear here after download</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((record: any) => (
            <div
              key={record.id}
              className="group flex items-center gap-4 px-5 py-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                {record.patient_name?.charAt(0)?.toUpperCase() || 'P'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{record.patient_name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {record.patient_dob && <span>DOB: {record.patient_dob}</span>}
                  {record.referring_doctor && <span>→ {record.referring_doctor}</span>}
                  {record.date && <span>{record.date}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onOpen(record)}>
                  <FileText className="h-3 w-3" />
                  Open
                </Button>
                <button
                  onClick={() => onDelete(record.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}