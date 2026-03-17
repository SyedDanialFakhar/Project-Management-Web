// src/components/analytics/LogsTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { User, PlusCircle, CheckCircle2, Gamepad2, Clock } from "lucide-react";

const getEventDisplay = (eventType: string) => {
  switch (eventType) {
    case "task_created":
      return {
        label: "Task Created",
        icon: <PlusCircle className="h-4 w-4" />,
        variant: "default" as const,
      };
    case "project_created":
      return {
        label: "Project Created",
        icon: <PlusCircle className="h-4 w-4" />,
        variant: "secondary" as const,
      };
    case "game_score":
      return {
        label: "Game Completed",
        icon: <Gamepad2 className="h-4 w-4" />,
        variant: "outline" as const,
      };
    default:
      return {
        label: eventType
          .split("_")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        icon: <Clock className="h-4 w-4" />,
        variant: "secondary" as const,
      };
  }
};

export default function LogsTable({
  logs,
  loadMore,
}: {
  logs: any[];
  loadMore: () => void;
}) {
  const hasLogs = logs.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {hasLogs ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left py-3.5 px-5 font-medium text-muted-foreground w-1/4">
                      User
                    </th>
                    <th className="text-left py-3.5 px-5 font-medium text-muted-foreground w-2/5">
                      Action
                    </th>
                    <th className="text-left py-3.5 px-5 font-medium text-muted-foreground">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const { label, icon, variant } = getEventDisplay(log.event_type);

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-muted/50 transition-colors duration-150"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                              <User className="h-4 w-4" />
                            </div>
                            <span className="font-medium truncate max-w-[180px]">
                              {log.users?.email?.split("@")[0] ||
                                log.user_id?.slice(0, 8) + "..."}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <Badge variant={variant} className="gap-1.5 px-3 py-1">
                            {icon}
                            {label}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-5 text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <span className="text-xs">
                              {format(new Date(log.created_at), "MMM d, yyyy • h:mm a")}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t bg-muted/20">
              <button
                onClick={loadMore}
                disabled={false} // you can add real hasMore logic later
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                Load More Activity
              </button>
            </div>
          </>
        ) : (
          <div className="py-16 px-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              When users create projects, tasks, or complete games, actions will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}