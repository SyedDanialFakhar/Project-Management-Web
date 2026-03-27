import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { SeekJob, JobLead, JobStatus } from '@/types/seek';

export function useJobLeads() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['jobLeads', userRow?.id],
    queryFn: async () => {
      if (!userRow?.id) return [];
      const { data, error } = await supabase
        .from('job_leads')
        .select('*')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userRow?.id,
  });

  const saveLead = useMutation({
    mutationFn: async (job: SeekJob) => {
      if (!userRow?.id) throw new Error('Not logged in');
      const { error } = await supabase.from('job_leads').insert({
        user_id: userRow.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        job_type: job.jobType,
        url: job.url,
        description: job.description,
        listed_date: job.listedDate,
        status: 'saved',
        tags: [],
        notes: '',
        source: 'seek',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobLeads'] }),
  });

  const updateLead = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{ status: JobStatus; tags: string[]; notes: string }>;
    }) => {
      const { error } = await supabase
        .from('job_leads')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobLeads'] }),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('job_leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobLeads'] }),
  });

  return { ...query, saveLead, updateLead, deleteLead };
}