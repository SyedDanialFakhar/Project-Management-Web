import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchSeekJobs } from '@/services/seekService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { SearchCriteria, SeekJob } from '@/types/seek';

export function useSeekSearch() {
  const [criteria, setCriteria] = useState<SearchCriteria | null>(null);
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);

  const query = useQuery({
    queryKey: ['seekJobs', criteria],
    queryFn: async () => {
      if (!criteria) return [];
      const jobs = await searchSeekJobs(
        criteria.keyword,
        criteria.location,
        criteria.jobType
      );

      // Save search to history
      if (userRow?.id) {
        await supabase.from('search_history').insert({
          user_id: userRow.id,
          keyword: criteria.keyword,
          location: criteria.location,
          job_type: criteria.jobType,
          results_count: jobs.length,
        }).then(() => {});
      }

      return jobs;
    },
    enabled: !!criteria,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  const search = useCallback((newCriteria: SearchCriteria) => {
    setCriteria(newCriteria);
  }, []);

  return { ...query, search, criteria };
}