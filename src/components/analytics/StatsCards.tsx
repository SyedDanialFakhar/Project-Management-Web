// src/components/analytics/StatsCards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { FolderGit2, ListChecks, Users, Activity } from "lucide-react";

interface StatsCardsProps {
  logs: any[];
}

export default function StatsCards({ logs }: StatsCardsProps) {
  const totalProjects = logs.filter(l => l.event_type === "project_created").length;
  const totalTasks   = logs.filter(l => l.event_type === "task_created").length;
  const activeUsers  = new Set(logs.map(l => l.user_id)).size;
  const totalEvents  = logs.length;

  const stats = [
    {
      title: "Projects Created",
      value: totalProjects,
      subtitle: "Total projects in the system",
      icon: <FolderGit2 className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Tasks Created",
      value: totalTasks,
      subtitle: "Total tasks across all projects",
      icon: <ListChecks className="h-5 w-5 text-green-500" />,
      color: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Active Users",
      value: activeUsers,
      subtitle: "Unique users who performed actions",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Total Events",
      value: totalEvents,
      subtitle: "All logged activities",
      icon: <Activity className="h-5 w-5 text-amber-500" />,
      color: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`
            overflow-hidden border transition-all duration-300
            hover:shadow-md hover:scale-[1.02] hover:border-primary/30
          `}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {stat.value.toLocaleString()}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1">
              {stat.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {stat.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}