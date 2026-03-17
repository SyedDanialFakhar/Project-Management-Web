import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useMemo } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AnalyticsChart({ logs }: { logs: any[] }) {
  const scoreData = useMemo(() => logs
    .filter(l => l.event_type === "game_score")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(l => ({
      date: new Date(l.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: l.event_value
    })), [logs]);

  const activityData = useMemo(() => {
    const map = new Map();
    logs.forEach(l => {
      const date = new Date(l.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
      if (!map.has(date)) map.set(date, { date, tasks: 0, projects: 0 });
      const e = map.get(date);
      if (l.event_type === "task_created") e.tasks++;
      if (l.event_type === "project_created") e.projects++;
    });
    return Array.from(map.values());
  }, [logs]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => counts[l.event_type] = (counts[l.event_type] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Scores Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}