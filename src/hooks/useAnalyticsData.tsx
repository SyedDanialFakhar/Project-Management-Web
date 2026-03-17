import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useAnalyticsData(range: { from: string; to: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true); // ✅ new

  const loadPage = async (initial = false) => {
    setIsLoading(true);
    const pageSize = initial ? 20 : 20;

    let q = supabase
      .from('analytics_logs')
      .select(`*, users(email)`)
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (range.from) q = q.gte('created_at', `${range.from}T00:00:00`);
    if (range.to)   q = q.lte('created_at', `${range.to}T23:59:59`);
    if (!initial && cursor) q = q.lt('created_at', cursor);

    const { data, error } = await q;

    if (!error && data) {
      if (initial) {
        setLogs(data);
      } else {
        setLogs(prev => [...prev, ...data]);
      }
      setHasMore(data.length === pageSize); // ✅ if less than pageSize, no more rows
      if (data.length > 0) {
        setCursor(data[data.length - 1]?.created_at ?? null);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setHasMore(true); // ✅ reset when filter changes
    setCursor(null);
    loadPage(true);

    const sub = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_logs' }, async (payload) => {
        const { data: newRow } = await supabase
          .from('analytics_logs')
          .select('*, users(email)')
          .eq('id', payload.new.id)
          .single();
        if (newRow) setLogs(prev => [newRow, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [range.from, range.to]);

  const loadMore = () => loadPage(false);

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const csvContent = [
      ['Date', 'User', 'Event', 'Value'],
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.users?.email || log.user_id.slice(0, 8) + '...',
        log.event_type,
        log.event_value,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return { logs, isLoading, loadMore, hasMore, exportToCSV }; // ✅ hasMore exported
}