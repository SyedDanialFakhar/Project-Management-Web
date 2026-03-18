import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  request: any;
  onReview: (status: 'approved' | 'rejected', reason?: string) => void;
}

export function ReviewLeaveModal({ open, onClose, request, onReview }: Props) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);

  if (!request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;
    onReview(action, action === 'rejected' ? rejectionReason : undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Review Leave Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Request details */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{request.users?.name || request.users?.email}</span>
              <LeaveStatusBadge status={request.status} />
            </div>
            <p className="text-muted-foreground">{request.leave_types?.name}</p>
            <p className="text-muted-foreground">
              {format(new Date(request.start_date), 'MMM d, yyyy')} → {format(new Date(request.end_date), 'MMM d, yyyy')}
              <span className="ml-2 font-medium text-foreground">({request.total_days} days)</span>
            </p>
            {request.reason && (
              <p className="text-muted-foreground italic">"{request.reason}"</p>
            )}
          </div>

          {/* Action selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('approved')}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                action === 'approved'
                  ? 'bg-green-500/10 border-green-500/40 text-green-600'
                  : 'border-border text-muted-foreground hover:border-green-500/40 hover:text-green-600'
              }`}
            >
              ✅ Approve
            </button>
            <button
              type="button"
              onClick={() => setAction('rejected')}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                action === 'rejected'
                  ? 'bg-red-500/10 border-red-500/40 text-red-600'
                  : 'border-border text-muted-foreground hover:border-red-500/40 hover:text-red-600'
              }`}
            >
              ❌ Reject
            </button>
          </div>

          {/* Rejection reason */}
          {action === 'rejected' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rejection Reason
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Provide a reason..."
                rows={3}
                className="resize-none"
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!action || (action === 'rejected' && !rejectionReason)}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}