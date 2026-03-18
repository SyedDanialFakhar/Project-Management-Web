import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export function useUserRole(authUserId?: string) {
  return useQuery({
    queryKey: ['userRole', authUserId],
    queryFn: async () => {
      if (!authUserId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('auth_id', authUserId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!authUserId,
  });
}