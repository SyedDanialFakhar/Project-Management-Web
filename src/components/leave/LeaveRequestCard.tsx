import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { Button } from '@/components/ui/button';

interface Props {
  request: any;
  isManager?: boolean;
  onReview?: (request: any) => void;
}

export function LeaveRequestCard({ request, isManager, onReview }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
        {(request.users?.name || request.users?.email || 'U').charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isManager && (
          <p className="text-sm font-semibold text-foreground">
            {request.users?.name || request.users?.email?.split('@')[0]}
          </p>
        )}
        <p className="text-sm font-medium text-foreground">{request.leave_types?.name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(request.start_date), 'MMM d')} → {format(new Date(request.end_date), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {request.total_days} day{request.total_days > 1 ? 's' : ''}
          </span>
        </div>
        {request.reason && (
          <p className="text-xs text-muted-foreground mt-1 italic">"{request.reason}"</p>
        )}
        {request.status === 'rejected' && request.rejection_reason && (
          <p className="text-xs text-red-500 mt-1">Reason: {request.rejection_reason}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <LeaveStatusBadge status={request.status} />
        {isManager && request.status === 'pending' && onReview && (
          <Button size="sm" variant="outline" onClick={() => onReview(request)}>
            Review
          </Button>
        )}
      </div>
    </div>
  );
}