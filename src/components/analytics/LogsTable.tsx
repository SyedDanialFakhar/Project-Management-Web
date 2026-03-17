// src/components/analytics/LogsTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { PlusCircle, Gamepad2, Clock, FolderPlus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const parseDate = (dateStr: string) => {
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+')
    ? dateStr
    : dateStr + 'Z';
  return new Date(normalized);
};

const getEventDisplay = (eventType: string) => {
  switch (eventType) {
    case "task_created":
      return {
        label: "Task Created",
        icon: <PlusCircle className="h-3.5 w-3.5" />,
        className: "bg-green-500/10 text-green-600 dark:text-green-400",
      };
    case "project_created":
      return {
        label: "Project Created",
        icon: <FolderPlus className="h-3.5 w-3.5" />,
        className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      };
    case "game_score":
      return {
        label: "Game Completed",
        icon: <Gamepad2 className="h-3.5 w-3.5" />,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        label: eventType
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        icon: <Clock className="h-3.5 w-3.5" />,
        className: "bg-muted text-muted-foreground",
      };
  }
};

export default function LogsTable({
  logs,
  loadMore,
  hasMore, // ✅ added
}: {
  logs: any[];
  loadMore: () => void;
  hasMore: boolean; // ✅ added
}) {
  const hasLogs = logs.length > 0;

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          {hasLogs && (
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
              {logs.length} events
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {hasLogs ? (
          <>
            <div className="divide-y divide-border/60">
              {logs.map((log) => {
                const { label, icon, className } = getEventDisplay(log.event_type);
                const username = log.users?.email?.split("@")[0] || log.user_id?.slice(0, 8) + "...";
                const initial = username.charAt(0).toUpperCase();
                const date = parseDate(log.created_at);

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors duration-150"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {username}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
                          className
                        )}>
                          {icon}
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(date, "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                      {formatDistanceToNow(date, { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ✅ Only show button if there are more pages */}
            {hasMore ? (
              <div className="p-4 border-t border-border/60">
                <button
                  onClick={loadMore}
                  className="w-full py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
                >
                  Load more
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">You've reached the end</p>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Activity className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              When users create projects, tasks, or complete games, actions will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}