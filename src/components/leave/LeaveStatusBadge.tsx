import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const CONFIG = {
  pending:  { label: 'Pending',  className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',   icon: <Clock className="h-3 w-3" /> },
  approved: { label: 'Approved', className: 'bg-green-500/10 text-green-600 dark:text-green-400',   icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 dark:text-red-400',         icon: <XCircle className="h-3 w-3" /> },
};

export function LeaveStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const { label, className, icon } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', className)}>
      {icon}
      {label}
    </span>
  );
}