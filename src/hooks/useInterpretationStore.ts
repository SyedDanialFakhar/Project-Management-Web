import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type { InterpretationStore } from '@/types/pdfInterpretation';

export function useInterpretationStore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all interpretation files for current user
  const { data: interpretationFiles = [], isLoading, error } = useQuery({
    queryKey: ['interpretation_store', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the user's internal ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('interpretation_store')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InterpretationStore[];
    },
    enabled: !!user?.id,
  });

  // Save a new interpretation file record
  const saveInterpretationFile = useMutation({
    mutationFn: async ({ 
      fileName, 
      interpretations, 
      patientCount 
    }: { 
      fileName: string; 
      interpretations: Record<string, string>; 
      patientCount: number;
    }) => {
      if (!user?.id) throw new Error('Not logged in');
      
      // Get user's internal ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('interpretation_store')
        .insert({
          user_id: userData.id,
          file_name: fileName,
          interpretations: interpretations,
          patient_count: patientCount,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interpretation_store', user?.id] });
    },
  });

  // Delete an interpretation file record
  const deleteInterpretationFile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('interpretation_store')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interpretation_store', user?.id] });
    },
  });

  return {
    interpretationFiles,
    isLoading,
    error,
    saveInterpretationFile,
    deleteInterpretationFile,
  };
}