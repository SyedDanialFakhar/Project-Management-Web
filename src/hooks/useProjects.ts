import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/database.types';
import { logEvent } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 9;

export function useProjects(authUserId: string | undefined) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['projects', authUserId, page],
    queryFn: async () => {
      if (!authUserId) return [];

      // Get internal user + role
      const { data: userRow } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_id', authUserId)
        .single();

      if (!userRow) return [];

      // ✅ Employees only see projects where they have assigned tasks
      if (userRow.role === 'employee') {
        const { data: assignedTasks } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('assigned_to', userRow.id);

        const projectIds = [...new Set(assignedTasks?.map(t => t.project_id) ?? [])];
        if (!projectIds.length) return [];

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('created_at', { ascending: false })
          .range(0, page * PAGE_SIZE - 1);

        if (error) throw error;
        return data as Project[];
      }

      // ✅ Admins/managers see all projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, page * PAGE_SIZE - 1);

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!authUserId,
  });

  const hasMore = (query.data?.length ?? 0) === page * PAGE_SIZE;
  const loadMore = () => setPage(prev => prev + 1);

  const createProject = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!authUserId) throw new Error("User not logged in");

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUserId)
        .single();

      if (userError || !userRow) throw userError || new Error("User not found");

      const userUUID = userRow.id;

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({ name, description, created_by: userUUID })
        .select()
        .single();

      if (projectError) throw projectError;

      await logEvent(userUUID, "project_created", 1);

      const message = `Project "${name}" created successfully.`;

      await supabase.from('notifications').insert({
        user_id: userUUID,
        type: 'project_created',
        message,
        is_read: false,
      });

      toast({ title: "New Notification", description: message });

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', authUserId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', authUserId] });
    },
  });

  return { ...query, createProject, deleteProject, loadMore, hasMore };
}