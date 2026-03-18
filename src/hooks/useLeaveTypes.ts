import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export function useLeaveTypes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createLeaveType = useMutation({
    mutationFn: async ({ name, max_days_per_year }: { name: string; max_days_per_year: number }) => {
      // 1. Create the leave type
      const { data: leaveType, error } = await supabase
        .from('leave_types')
        .insert({ name, max_days_per_year })
        .select()
        .single();
      if (error) throw error;

      // 2. Fetch all users using existing "Allow authenticated users to read users" policy
      const { data: users } = await supabase
        .from('users')
        .select('id');

      // 3. Auto-assign balance to every user
      if (users?.length) {
        const year = new Date().getFullYear();
        const balances = users.map(u => ({
          user_id: u.id,
          leave_type_id: leaveType.id,
          total_days: max_days_per_year,
          used_days: 0,
          year,
        }));

        await supabase
          .from('leave_balances')
          .insert(balances)
          .throwOnError();
      }

      toast({ title: 'Leave type created', description: `${name} assigned to all employees.` });
      return leaveType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
  });

  const deleteLeaveType = useMutation({
    mutationFn: async (id: string) => {
      // Delete balances first to avoid FK constraint
      await supabase.from('leave_balances').delete().eq('leave_type_id', id);
      const { error } = await supabase.from('leave_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
  });

  return { ...query, createLeaveType, deleteLeaveType };
}