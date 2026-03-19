import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Task, TaskStatus } from '@/types/database.types';
import { useEffect } from 'react';
import { logEvent } from '@/lib/analytics';

const statusLabel: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export function useTasks(projectId: string | undefined) {
  const queryClient = useQueryClient();

  // ✅ No toast here — realtime in useNotifications handles it for the recipient only
  const createNotification = async (userId: string, message: string, type: string) => {
    if (!userId) return;
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      message,
      is_read: false,
    });
  };

  const getProjectName = async (projId: string): Promise<string> => {
    const { data } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projId)
      .single();
    return data?.name ?? 'Unknown Project';
  };

  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
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

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`tasks-realtime-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      )
      .subscribe();
  
    // ✅ Return sync cleanup — don't await inside cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const createTask = useMutation({
    mutationFn: async ({ title, description, assigned_to, due_date, priority, status }: any) => {
      if (!projectId) throw new Error("No project selected");

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          project_id: projectId,
          assigned_to,
          status: status ?? 'todo',
          priority: priority ?? 'medium',
          due_date: due_date ? new Date(due_date) : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log analytics event
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser.user.id)
          .single();
        if (userRow) await logEvent(userRow.id, "task_created", 1);
      }

      // ✅ Only notify the assigned person — no toast on admin side
      if (assigned_to) {
        const projectName = await getProjectName(projectId);
        await createNotification(
          assigned_to,
          `You have been assigned a new task "${data.title}" in project "${projectName}".`,
          'task_assigned'
        );
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, ...updates }: any) => {
      // ✅ Get old task first to detect assignee change
      const { data: oldTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      if (error) throw error;

      if (projectId) {
        const projectName = await getProjectName(projectId);

        // ✅ If assignee changed — notify new assignee only
        if (updates.assigned_to && updates.assigned_to !== oldTask?.assigned_to) {
          await createNotification(
            updates.assigned_to,
            `You have been assigned a new task "${data.title}" in project "${projectName}".`,
            'task_assigned'
          );
        } else if (data.assigned_to) {
          // ✅ Just updated — notify current assignee only
          await createNotification(
            data.assigned_to,
            `Task "${data.title}" in project "${projectName}" was updated.`,
            'task_updated'
          );
        }
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .single();
      if (error) throw error;

      // ✅ Only notify the assigned person — no toast on whoever changed the status
      if (data.assigned_to && projectId) {
        const projectName = await getProjectName(projectId);
        const readable = statusLabel[status] ?? status;
        await createNotification(
          data.assigned_to,
          `Task "${data.title}" in project "${projectName}" moved to "${readable}".`,
          'task_status_changed'
        );
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      // ✅ Only notify the assigned person
      if (task?.assigned_to && projectId) {
        const projectName = await getProjectName(projectId);
        await createNotification(
          task.assigned_to,
          `Task "${task.title}" in project "${projectName}" was deleted.`,
          'task_deleted'
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  return { ...query, createTask, updateTask, updateTaskStatus, deleteTask };
}