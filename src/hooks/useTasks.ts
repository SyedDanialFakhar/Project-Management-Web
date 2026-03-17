// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Task, TaskStatus } from '@/types/database.types';
import { useEffect } from 'react';
import { logEvent } from "@/lib/analytics";

export function useTasks(projectId: string) {
  const queryClient = useQueryClient();

  const createNotification = async (userId: string, message: string) => {
    await supabase.from('notifications').insert({
      user_id: userId,
      message,
      is_read: false,
      created_at: new Date(),
    });
  };

  // SIMPLE QUERY - loads ALL tasks (perfect for Kanban)
  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
  });

  // Realtime (now safe)
  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [projectId, queryClient]);

  // === Mutations (unchanged) ===
  const createTask = useMutation({
    mutationFn: async ({ title, description, assigned_to, due_date }: any) => {
  
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          project_id: projectId,
          assigned_to,
          status: 'todo',
          created_at: new Date(),
          due_date: due_date ? new Date(due_date) : null
        })
        .select()
        .single();
  
      if (error) throw error;
  
      // ✅ GET CURRENT USER (THIS IS WHAT YOU ASKED ABOUT)
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
  
      // ✅ LOG ANALYTICS
      if (userId) {
        await logEvent(userId, "task_created", 1);
      }
  
      // notification (your existing logic)
      if (assigned_to) {
        await createNotification(
          assigned_to,
          You have been assigned a new task "${data.title}".
        );
      }
  
      return data;
    },
  
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, ...updates }: any) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single();
      if (error) throw error;
      if (data.assigned_to) await createNotification(data.assigned_to, `Task "${data.title}" was updated.`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { data, error } = await supabase.from('tasks').update({ status }).eq('id', taskId).select().single();
      if (error) throw error;
      if (data.assigned_to) await createNotification(data.assigned_to, `Task "${data.title}" moved to "${status}".`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      if (task?.assigned_to) await createNotification(task.assigned_to, `Task "${task.title}" was deleted.`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  return {
    ...query,                 // data is now just Task[] (no pages)
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}