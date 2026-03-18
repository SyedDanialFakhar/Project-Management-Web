import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

const notifyManagers = async (message: string, type: string) => {
  // Get all managers and admins internal user ids
  const { data: managers, error } = await supabase
    .from('users')
    .select('id')
    .in('role', ['manager', 'admin']);

  if (error || !managers?.length) return;

  const notifications = managers.map(m => ({
    user_id: m.id,
    type,
    message,
    is_read: false,
  }));

  await supabase.from('notifications').insert(notifications);
};

const notifyUser = async (userId: string, message: string, type: string) => {
  if (!userId) return;
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    message,
    is_read: false,
  });
  if (error) console.error('Notify user error:', error);
};

export function useLeaveRequests(userId?: string, isManager = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leaveRequests', userId, isManager],
    queryFn: async () => {
      if (!userId) return [];

      let q = supabase
        .from('leave_requests')
        .select(`
          *,
          leave_types(name),
          users!leave_requests_user_id_fkey(id, name, email),
          reviewer:users!leave_requests_reviewed_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (!isManager) q = q.eq('user_id', userId);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const applyLeave = useMutation({
    mutationFn: async ({
      leave_type_id,
      start_date,
      end_date,
      total_days,
      reason,
      userName,
    }: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      total_days: number;
      reason: string;
      userName: string;
    }) => {
      if (!userId) throw new Error('No user');

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({ user_id: userId, leave_type_id, start_date, end_date, total_days, reason })
        .select()
        .single();
      if (error) throw error;

      await notifyManagers(
        `${userName} has applied for ${total_days} day(s) of leave from ${start_date} to ${end_date}.`,
        'leave_applied'
      );

      toast({ title: 'Leave Applied', description: 'Your leave request has been submitted.' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const reviewLeave = useMutation({
    mutationFn: async ({
      requestId,
      status,
      rejection_reason,
      reviewerId,
      applicantId, // ✅ this must be internal users.id not auth_id
      applicantName,
      days,
      leaveTypeId,
    }: {
      requestId: string;
      status: 'approved' | 'rejected';
      rejection_reason?: string;
      reviewerId: string;
      applicantId: string;
      applicantName: string;
      days: number;
      leaveTypeId: string;
    }) => {
      // 1. Update leave request status
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejection_reason ?? null,
        })
        .eq('id', requestId)
        .select()
        .single();
      if (error) throw error;

      // 2. Deduct balance if approved
      if (status === 'approved') {
        const year = new Date().getFullYear();
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', applicantId)
          .eq('leave_type_id', leaveTypeId)
          .eq('year', year)
          .single();

        if (balance) {
          await supabase
            .from('leave_balances')
            .update({ used_days: balance.used_days + days })
            .eq('id', balance.id);
        }
      }

      // 3. ✅ Notify the employee using their internal user id
      const msg = status === 'approved'
        ? `Your leave request has been approved.`
        : `Your leave request has been rejected. Reason: ${rejection_reason ?? 'No reason provided.'}`;

      await notifyUser(
        applicantId, // ✅ internal users.id — not auth_id
        msg,
        status === 'approved' ? 'leave_approved' : 'leave_rejected'
      );

      toast({ title: status === 'approved' ? 'Leave Approved ✅' : 'Leave Rejected ❌' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return { ...query, applyLeave, reviewLeave };
}