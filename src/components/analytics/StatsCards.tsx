export default function StatsCards({ logs }: { logs: any[] }) {
    const totalProjects = logs.filter(l => l.event_type === "project_created").length;
    const totalTasks = logs.filter(l => l.event_type === "task_created").length;
    const totalScore = logs
      .filter(l => l.event_type === "game_score")
      .reduce((acc, curr) => acc + curr.event_value, 0);
    const activeUsers = new Set(logs.map(l => l.user_id)).size;
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card title="Projects Created" value={totalProjects} subtitle="Total projects" />
        <Card title="Tasks Created" value={totalTasks} subtitle="Total tasks" />
        <Card title="Game Score" value={totalScore} subtitle="All-time total" />
        <Card title="Active Users" value={activeUsers} subtitle="Unique players" />
        <Card title="Total Events" value={logs.length} subtitle="All logs" />
      </div>
    );
  }
  
  function Card({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
    return (
      <div className="p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
        <p className="text-sm text-muted-foreground">{title}</p>
        <h2 className="text-5xl font-bold tracking-tighter mt-3">{value.toLocaleString()}</h2>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    );
  }