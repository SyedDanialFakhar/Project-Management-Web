import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export function useFlappyLeaderboard() {
  return useQuery({
    queryKey: ['flappy_scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flappy_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });
}