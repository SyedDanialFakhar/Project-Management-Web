// components/seek/JobCard.tsx
import { ExternalLink, Bookmark, BookmarkCheck, MapPin, Building2, Clock, DollarSign, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SeekJob } from '@/types/seek';

interface Props {
  job: SeekJob;
  isSaved: boolean;
  onSave: (job: SeekJob) => void;
  isSaving: boolean;
}

export function JobCard({ job, isSaved, onSave, isSaving }: Props) {
  return (
    <div className={cn(
      'group flex flex-col h-full gap-4 p-6 rounded-3xl border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
      isSaved ? 'border-primary/30 bg-primary/5' : 'border-border/60 hover:border-primary/30'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium text-muted-foreground truncate">{job.company}</p>
          </div>
        </div>
        <span className="flex-shrink-0 px-3 py-1 text-[10px] font-bold tracking-widest bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-2xl border border-blue-500/30">
          SEEK
        </span>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm flex-1">
        {job.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.salary && job.salary !== 'Not specified' && (
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.salary}</span>
          </div>
        )}
        {job.jobType && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span className="capitalize">{job.jobType}</span>
          </div>
        )}
        {job.listedDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{job.listedDate}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed border-t border-border/30 pt-3">
          {job.description}
        </p>
      )}

      {/* Actions - Always aligned at bottom */}
      <div className="flex gap-3 pt-4 mt-auto border-t border-border/30">
        <Button
          size="sm"
          variant={isSaved ? 'outline' : 'default'}
          className={cn('flex-1 h-9 gap-2', isSaved && 'border-primary text-primary')}
          onClick={() => !isSaved && onSave(job)}
          disabled={isSaved || isSaving}
        >
          {isSaved ? (
            <><BookmarkCheck className="h-4 w-4" /> Saved</>
          ) : (
            <><Bookmark className="h-4 w-4" /> Save as Lead</>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-9 px-6 gap-2"
          onClick={() => job.url && window.open(job.url, '_blank', 'noopener,noreferrer')}
          disabled={!job.url}
        >
          <ExternalLink className="h-4 w-4" /> View
        </Button>
      </div>
    </div>
  );
}