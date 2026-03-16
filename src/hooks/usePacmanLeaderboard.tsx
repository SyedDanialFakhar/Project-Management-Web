import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';

export function usePacmanLeaderboard() {

  return useQuery({

    queryKey: ["pacman_scores"],

    queryFn: async () => {

      const { data, error } = await supabase
        .from("pacman_scores")
        .select("*")
        .order("score", { ascending: false })
        .limit(10);

      if (error) throw error;

      return data;
    }

  });

}