export default function StatsCards({ logs }: { logs: any[] }) {
    const totalTasks = logs.filter(l => l.event_type === "task_created").length;
  
    const totalScore = logs
      .filter(l => l.event_type === "game_score")
      .reduce((acc, curr) => acc + curr.event_value, 0);
  
    return (
      <div className="grid grid-cols-3 gap-4">
        <Card title="Tasks Created" value={totalTasks} />
        <Card title="Game Score" value={totalScore} />
        <Card title="Total Events" value={logs.length} />
      </div>
    );
  }
  
  function Card({ title, value }: any) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <p className="text-sm text-muted-foreground">{title}</p>
        <h2 className="text-xl font-bold">{value}</h2>
      </div>
    );
  }