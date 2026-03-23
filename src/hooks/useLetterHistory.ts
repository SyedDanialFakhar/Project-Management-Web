import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { ExtractedLetterData } from './useLetterGenerator';

export function useLetterHistory() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['letterHistory', userRow?.id],
    queryFn: async () => {
      if (!userRow?.id) return [];
      const { data, error } = await supabase
        .from('letter_history')
        .select('*')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userRow?.id,
  });

  const saveLetter = useMutation({
    mutationFn: async (extracted: ExtractedLetterData) => {
      if (!userRow?.id) throw new Error('Not logged in');
      const { error } = await supabase.from('letter_history').insert({
        user_id: userRow.id,
        patient_name: extracted.patientName,
        patient_dob: extracted.patientDOB,
        referring_doctor: extracted.referringDoctorName,
        date: extracted.date,
        extracted_data: extracted,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letterHistory', userRow?.id] });
    },
  });

  const deleteLetter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('letter_history').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letterHistory', userRow?.id] });
    },
  });

  return { ...query, saveLetter, deleteLetter };
}