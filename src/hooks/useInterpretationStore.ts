import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { PatientInterpretation } from './usePdfInterpretation';

export function useInterpretationStore() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['interpretations', userRow?.id],
    queryFn: async () => {
      if (!userRow?.id) return [];
      const { data, error } = await supabase
        .from('interpretation_store')
        .select('*')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userRow?.id,
  });

  const saveInterpretations = useMutation({
    mutationFn: async ({
      fileName,
      interpretations,
    }: {
      fileName: string;
      interpretations: PatientInterpretation[];
    }) => {
      if (!userRow?.id) throw new Error('Not logged in');
      const { error } = await supabase.from('interpretation_store').insert({
        user_id: userRow.id,
        file_name: fileName,
        interpretations,
        patient_count: interpretations.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interpretations', userRow?.id] });
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interpretation_store').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interpretations', userRow?.id] });
    },
  });

  return { ...query, saveInterpretations, deleteStore };
}