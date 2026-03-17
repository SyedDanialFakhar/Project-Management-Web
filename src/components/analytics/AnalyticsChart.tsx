// src/components/analytics/AnalyticsChart.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts';
import { useMemo } from 'react';

const LINE_COLORS = {
  projects: '#6366f1',
  tasks: '#22c55e',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-foreground pb-2 mb-2 border-b border-border">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="bg-background border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground mt-0.5">
        {value} events · {(percent * 100).toFixed(1)}%
      </p>
    </div>
  );
};

export default function AnalyticsChart({ logs }: { logs: any[] }) {
  const activityData = useMemo(() => {
    const map = new Map<string, { date: string; tasks: number; projects: number }>();
    logs.forEach((log) => {
      const dateKey = new Date(log.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!map.has(dateKey)) map.set(dateKey, { date: dateKey, tasks: 0, projects: 0 });
      const entry = map.get(dateKey)!;
      if (log.event_type === 'task_created') entry.tasks += 1;
      if (log.event_type === 'project_created') entry.projects += 1;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [logs]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.event_type] = (counts[log.event_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({
        name:
          name === 'task_created' ? 'Tasks Created' :
          name === 'project_created' ? 'Projects Created' :
          name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const totalEvents = pieData.reduce((sum, d) => sum + d.value, 0);
  const hasActivity = activityData.length > 0;
  const hasPie = pieData.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">

      {/* ── Line Chart ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Activity Over Time</CardTitle>
          <CardDescription className="text-xs">Daily count of new projects and tasks</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 px-4">
          {hasActivity ? (
            // ✅ wrapper is flex column — chart + legend both inside, no overflow
            <div className="flex flex-col gap-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activityData}
                    margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomLineTooltip />}
                      cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      name="Projects"
                      stroke={LINE_COLORS.projects}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: LINE_COLORS.projects, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasks"
                      name="Tasks"
                      stroke={LINE_COLORS.tasks}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: LINE_COLORS.tasks, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ✅ Legend OUTSIDE the chart container — never clipped */}
              <div className="flex items-center justify-center gap-6 pt-1 border-t border-border/40">
                {[
                  { label: 'Projects', color: LINE_COLORS.projects },
                  { label: 'Tasks', color: LINE_COLORS.tasks },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center gap-2 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2 text-xl">📈</div>
              <p className="text-sm font-medium text-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground">Create projects or tasks to see trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pie Chart ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Event Distribution</CardTitle>
          <CardDescription className="text-xs">Breakdown of all recorded actions</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 px-4">
          {hasPie ? (
            <div className="flex flex-col gap-4">
              {/* Donut chart with center label via Recharts Label */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={58}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                      paddingAngle={3}
                    >
                      {/* ✅ Label inside Pie, not Legend — this is the correct Recharts API */}
                      <Label
                        content={({ viewBox }: any) => {
                          const { cx, cy } = viewBox;
                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 6}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={24}
                                fontWeight={700}
                                fill="hsl(var(--foreground))"
                              >
                                {totalEvents}
                              </text>
                              <text
                                x={cx}
                                y={cy + 14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={11}
                                fill="hsl(var(--muted-foreground))"
                              >
                                total events
                              </text>
                            </g>
                          );
                        }}
                        position="center"
                      />
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* ✅ Legend rows with correct % — calculated in JS, not Recharts */}
              <div className="flex flex-col gap-2 pt-1 border-t border-border/40">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${totalEvents > 0 ? (entry.value / totalEvents) * 100 : 0}%`,
                            backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="font-medium text-foreground w-6 text-right">{entry.value}</span>
                      <span className="text-muted-foreground w-10 text-right">
                        {totalEvents > 0 ? ((entry.value / totalEvents) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center gap-2 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2 text-xl">🥧</div>
              <p className="text-sm font-medium text-foreground">No events recorded</p>
              <p className="text-xs text-muted-foreground">Actions will appear here once logged</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}