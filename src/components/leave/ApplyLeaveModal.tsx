import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';
import { differenceInBusinessDays, parseISO } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (data: any) => void;
}

export function ApplyLeaveModal({ open, onClose, onApply }: Props) {
  const { data: leaveTypes = [] } = useLeaveTypes();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setLeaveTypeId(''); setStartDate(''); setEndDate(''); setReason('');
    }
  }, [open]);

  const totalDays = startDate && endDate
    ? Math.max(1, differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) return;
    onApply({ leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, total_days: totalDays, reason });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Apply for Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>

          {totalDays > 0 && (
            <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
              📅 Total business days: <span className="font-semibold text-foreground">{totalDays}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Brief reason for leave..."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!leaveTypeId || !startDate || !endDate}>Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}