import { useLeaveBalances } from '@/hooks/useLeaveBalances';

export function LeaveBalanceWidget({ userId }: { userId: string }) {
  const { data: balances = [], isLoading } = useLeaveBalances(userId);

  if (isLoading) return null;
  if (!balances.length) return (
    <p className="text-xs text-muted-foreground">No leave balance assigned yet.</p>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {balances.map((b: any) => {
        const remaining = b.total_days - b.used_days;
        const pct = b.total_days > 0 ? (b.used_days / b.total_days) * 100 : 0;
        return (
          <div key={b.id} className="p-4 rounded-xl border border-border/60 bg-card flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {b.leave_types?.name}
            </p>
            <p className="text-2xl font-bold text-foreground">{remaining}
              <span className="text-sm font-normal text-muted-foreground"> / {b.total_days} days</span>
            </p>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{b.used_days} used</p>
          </div>
        );
      })}
    </div>
  );
}