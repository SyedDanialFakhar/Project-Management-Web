import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Task, TaskStatus } from '@/types/database.types';
import { useEffect } from 'react';

const TASKS_PER_PAGE = 20;

export function useTasks(projectId: string) {
  const queryClient = useQueryClient();

  const createNotification = async (userId: string, message: string) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      message,
      is_read: false,
      created_at: new Date(),
    });
    if (error) console.error('Notification error:', error);
  };

  const query = useInfiniteQuery({
    queryKey: ['tasks', projectId],
    queryFn: async ({ pageParam }) => {
      let request = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(TASKS_PER_PAGE);

      if (pageParam) {
        request = request.lt('created_at', pageParam);
      }

      const { data, error } = await request;
      if (error) throw error;

      // calculate next cursor
      const nextCursor = data.length === TASKS_PER_PAGE ? data[data.length - 1].created_at : undefined;

      return { data, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  // Realtime updates
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

  // CREATE TASK
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
          due_date: due_date ? new Date(due_date) : null,
        })
        .select()
        .single();
      if (error) throw error;
      if (assigned_to) await createNotification(assigned_to, `You have been assigned a new task "${data.title}".`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  // UPDATE TASK
  const updateTask = useMutation({
    mutationFn: async ({ taskId, status, assigned_to }: any) => {
      const updateData: Partial<Task> = {};
      if (status) updateData.status = status;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

      const { data, error } = await supabase.from('tasks').update(updateData).eq('id', taskId).select().single();
      if (error) throw error;
      if (data.assigned_to) await createNotification(data.assigned_to, `Task "${data.title}" was updated.`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  // UPDATE STATUS
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { data, error } = await supabase.from('tasks').update({ status }).eq('id', taskId).select().single();
      if (error) throw error;
      if (data.assigned_to) await createNotification(data.assigned_to, `Task "${data.title}" moved to "${status}".`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  // DELETE TASK
  const deleteTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      if (task?.assigned_to) await createNotification(task.assigned_to, `Task "${task.title}" was deleted.`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  return { ...query, createTask, updateTask, updateTaskStatus, deleteTask };
}