import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export function useLeaveBalances(userId?: string) {
  return useQuery({
    queryKey: ['leaveBalances', userId],
    queryFn: async () => {
      if (!userId) return [];
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*, leave_types(name)')
        .eq('user_id', userId)
        .eq('year', year);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}