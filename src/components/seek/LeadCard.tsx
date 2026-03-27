import { useState } from 'react';
import { ExternalLink, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { JobStatus } from '@/types/seek';

interface Props {
  lead: any;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS: { value: JobStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'saved', label: 'Saved', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'contacted', label: 'Contacted', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { value: 'ignored', label: 'Ignored', color: 'bg-muted text-muted-foreground border-border/40' },
];

export function LeadCard({ lead, onUpdateStatus, onUpdateNotes, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);

  const statusStyle = STATUS_OPTIONS.find(s => s.value === lead.status)?.color ?? STATUS_OPTIONS[0].color;

  function saveNotes() {
    onUpdateNotes(lead.id, notes);
    setEditingNotes(false);
  }

  return (
    <div className="flex flex-col gap-4 p-6 rounded-3xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate text-foreground">{lead.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lead.company} · {lead.location}</p>
        </div>

        <select
          value={lead.status}
          onChange={e => onUpdateStatus(lead.id, e.target.value as JobStatus)}
          className={cn(
            'text-xs font-semibold px-4 py-2 rounded-3xl border cursor-pointer focus:outline-none appearance-none',
            statusStyle
          )}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {lead.salary && <span>💰 {lead.salary}</span>}
        {lead.job_type && <span>💼 {lead.job_type}</span>}
        {lead.listed_date && <span>🕐 {lead.listed_date}</span>}
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? 'Hide details & notes' : 'Show details & notes'}
      </button>

      {expanded && (
        <div className="space-y-4 pt-4 border-t border-border/30">
          {lead.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {lead.description}
            </p>
          )}

          {/* Notes section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Notes
            </p>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="w-full resize-y min-h-[100px] rounded-2xl border border-border/60 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Add your notes about this lead..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNotes}>Save Notes</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setNotes(lead.notes || ''); setEditingNotes(false); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="w-full text-left p-4 rounded-2xl border border-dashed border-border/60 hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {notes || 'Click to add notes...'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-10 gap-2"
          onClick={() => lead.url && window.open(lead.url, '_blank', 'noopener,noreferrer')}
          disabled={!lead.url}
        >
          <ExternalLink className="h-4 w-4" /> View on SEEK
        </Button>

        <button
          onClick={() => onDelete(lead.id)}
          className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}