import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/database.types';
import { logEvent } from "@/lib/analytics";

export function useProjects(authUserId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projects', authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!authUserId,
  });

  const createProject = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {

      if (!authUserId) throw new Error("User not logged in");

      // get UUID from users table
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUserId)
        .single();

      if (userError) throw userError;

      const userUUID = userRow.id;

      // create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          created_by: userUUID
        })
        .select()
        .single();
      if (projectError) throw projectError;
      await logEvent(userUUID, "project_created", 1);
      // notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userUUID,
          message: `Project "${name}" created successfully`,
          is_read: false,
          created_at: new Date(),
        });

      if (notifError) console.error('Notification failed:', notifError);

      return project;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', authUserId] });
    },
  });

  return { ...query, createProject };
}