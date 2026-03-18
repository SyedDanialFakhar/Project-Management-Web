import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useNotifications(internalUserId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', internalUserId],
    queryFn: async () => {
      if (!internalUserId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', internalUserId) // ✅ internal users.id
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!internalUserId,
  });

  useEffect(() => {
    if (!internalUserId) return;

    const channel = supabase
      .channel(`notifications-${internalUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${internalUserId}`,
        },
        (payload) => {
          const notification: any = payload.new;
          toast({ title: "New Notification", description: notification.message });
          queryClient.invalidateQueries({ queryKey: ['notifications', internalUserId] });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [internalUserId, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', internalUserId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', internalUserId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', internalUserId] });
    },
  });

  const unreadCount = query.data?.filter((n: any) => !n.is_read).length ?? 0;

  return { ...query, markAsRead, markAllAsRead, unreadCount };
}