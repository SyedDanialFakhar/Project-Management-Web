import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import StatsCards from "@/components/analytics/StatsCards";
import AnalyticsChart from "@/components/analytics/AnalyticsChart";
import LogsTable from "@/components/analytics/LogsTable";

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("analytics_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setLogs(data || []);
    setCursor(data?.[data.length - 1]?.created_at || null);
  };

  const loadMore = async () => {
    if (!cursor) return;

    const { data } = await supabase
      .from("analytics_logs")
      .select("*")
      .lt("created_at", cursor)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data?.length) {
      setLogs((prev) => [...prev, ...data]);
      setCursor(data[data.length - 1].created_at);
    }
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("analytics")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_logs",
        },
        (payload) => {
          setLogs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Analytics Dashboard</h1>

      <StatsCards logs={logs} />
      <AnalyticsChart logs={logs} />
      <LogsTable logs={logs} loadMore={loadMore} />
    </div>
  );
}