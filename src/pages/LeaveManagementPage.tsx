import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import { ReviewLeaveModal } from '@/components/leave/ReviewLeaveModal';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const { data: requests = [], isLoading, reviewLeave } = useLeaveRequests(userRow?.id, true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [reviewing, setReviewing] = useState<any>(null);

  if (userRow && !['manager', 'admin'].includes(userRow.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Access denied. Managers and admins only.</p>
      </div>
    );
  }

  const filtered = filter === 'all' ? requests : requests.filter((r: any) => r.status === filter);
  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Management</p>
        <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} need your review` : 'All requests reviewed'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-4 py-1.5 rounded-full border capitalize transition-all ${
              filter === f
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
            }`}
          >
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500/20 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl bg-muted/10">
          <p className="text-sm font-medium text-foreground mb-1">No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r: any) => (
            <LeaveRequestCard
              key={r.id}
              request={r}
              isManager
              onReview={setReviewing}
            />
          ))}
        </div>
      )}

      <ReviewLeaveModal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        request={reviewing}
        onReview={(status, reason) => {
            if (!reviewing || !userRow) return;
            reviewLeave.mutate({
              requestId: reviewing.id,
              status,
              rejection_reason: reason,
              reviewerId: userRow.id,
              applicantId: reviewing.user_id, // ✅ this is already internal users.id from leave_requests
              applicantName: reviewing.users?.name || reviewing.users?.email,
              days: reviewing.total_days,
              leaveTypeId: reviewing.leave_type_id,
            });
            setReviewing(null);
          }}
      />
    </div>
  );
}