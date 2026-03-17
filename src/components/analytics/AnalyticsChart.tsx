// src/components/analytics/AnalyticsChart.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts';
import { useMemo } from 'react';

const LINE_COLORS = {
  projects: '#2563eb',   // vibrant blue
  tasks:    '#16a34a',   // emerald green
};

const PIE_COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#db2777'];

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#000"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
      className="drop-shadow-md"
    >
      {name} • {(percent * 100).toFixed(0)}%
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 text-sm min-w-[220px]">
      <p className="font-semibold text-foreground pb-2 border-b">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={`tooltip-item-${i}`} className="flex justify-between items-center py-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-foreground/90">{entry.name}</span>
          </div>
          <span className="font-semibold text-foreground">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsChart({ logs }: { logs: any[] }) {
  // ── Line Chart Data (Projects + Tasks only) ───────────────────────────────────────
  const activityData = useMemo(() => {
    const map = new Map<string, { date: string; tasks: number; projects: number }>();

    logs.forEach((log) => {
      const dateKey = new Date(log.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, tasks: 0, projects: 0 });
      }

      const entry = map.get(dateKey)!;

      if (log.event_type === 'task_created') entry.tasks += 1;
      if (log.event_type === 'project_created') entry.projects += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [logs]);

  // ── Pie Chart Data ────────────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};

    logs.forEach((log) => {
      counts[log.event_type] = (counts[log.event_type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name === 'task_created' ? 'Tasks Created' :
              name === 'project_created' ? 'Projects Created' :
              name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const hasActivity = activityData.length > 0;
  const hasPie = pieData.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Activity Over Time – Line Chart */}
      <Card className="border-border/50 shadow-sm hover:shadow transition-shadow duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Activity Over Time</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Daily count of new projects and tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 pb-6">
          {hasActivity ? (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{ top: 20, right: 40, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.4)" />
                  <XAxis
                    dataKey="date"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: '13px',
                      paddingTop: '16px',
                      color: 'hsl(var(--foreground))',
                    }}
                    iconType="circle"
                    iconSize={10}
                  />
                  <Line
                    type="monotone"
                    dataKey="projects"
                    name="Projects Created"
                    stroke={LINE_COLORS.projects}
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Tasks Created"
                    stroke={LINE_COLORS.tasks}
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[420px] flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No activity yet</p>
              <p className="text-sm">Create projects or tasks to see daily trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Distribution – Pie Chart with very visible labels */}
      <Card className="border-border/50 shadow-sm hover:shadow transition-shadow duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Event Distribution</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Percentage of each type of action
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 pb-6">
          {hasPie ? (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={160}
                    innerRadius={70}
                    dataKey="value"
                    nameKey="name"
                    label={renderCustomizedLabel}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground)/0.6)', strokeWidth: 1.5 }}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{
                      fontSize: '13.5px',
                      paddingTop: '20px',
                      color: 'hsl(var(--foreground))',
                    }}
                    iconType="circle"
                    iconSize={12}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[420px] flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No events recorded</p>
              <p className="text-sm">Actions will appear here once logged</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}