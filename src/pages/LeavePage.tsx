import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { LeaveBalanceWidget } from '@/components/leave/LeaveBalanceWidget';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import { ApplyLeaveModal } from '@/components/leave/ApplyLeaveModal';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export default function LeavePage() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const { data: requests = [], isLoading, applyLeave } = useLeaveRequests(userRow?.id);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Leave</p>
          <h1 className="text-3xl font-bold tracking-tight">My Leaves</h1>
          <p className="text-sm text-muted-foreground mt-1">Apply and track your leave requests</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 mt-1">
          <Plus className="h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      {/* Balance */}
      {userRow?.id && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Leave Balance</h2>
          <LeaveBalanceWidget userId={userRow.id} />
        </div>
      )}

      {/* Requests */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">My Requests</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl bg-muted/10">
            <p className="text-sm font-medium text-foreground mb-1">No leave requests yet</p>
            <p className="text-xs text-muted-foreground">Click "Apply Leave" to submit your first request.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r: any) => (
              <LeaveRequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>

      <ApplyLeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApply={(data) => applyLeave.mutate({ ...data, userName: userRow?.name || user?.email || 'Someone' })}
      />
    </div>
  );
}