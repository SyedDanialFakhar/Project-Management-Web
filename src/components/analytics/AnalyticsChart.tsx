import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
  } from "recharts";
  
  export default function AnalyticsChart({ logs }: { logs: any[] }) {
  
    const data = logs.slice(0, 20).map(log => ({
      date: new Date(log.created_at).toLocaleTimeString(),
      value: log.event_value
    }));
  
    return (
      <div className="h-64 border rounded-lg p-4 bg-card">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  