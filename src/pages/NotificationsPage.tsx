import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell, Check, CheckCheck,
  FolderPlus, UserCheck, ArrowRightLeft,
  Pencil, Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  project_created: {
    icon: <FolderPlus className="h-4 w-4" />,
    color: 'text-blue-500 bg-blue-500/10',
  },
  task_assigned: {
    icon: <UserCheck className="h-4 w-4" />,
    color: 'text-violet-500 bg-violet-500/10',
  },
  task_status_changed: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: 'text-amber-500 bg-amber-500/10',
  },
  task_updated: {
    icon: <Pencil className="h-4 w-4" />,
    color: 'text-green-500 bg-green-500/10',
  },
  task_deleted: {
    icon: <Trash2 className="h-4 w-4" />,
    color: 'text-red-500 bg-red-500/10',
  },
  default: {
    icon: <Bell className="h-4 w-4" />,
    color: 'text-muted-foreground bg-muted',
  },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    data: notifications = [],
    isLoading,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications(user?.id);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-7 w-7 text-foreground" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
            <Bell className="h-10 w-10 text-muted-foreground/70" />
          </div>
          <h2 className="text-xl font-medium">You're all caught up!</h2>
          <p className="text-muted-foreground max-w-md">
            When you get new notifications, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.default;

            return (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead.mutate(notification.id)}
                className={cn(
                  "group relative flex items-start gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer",
                  !notification.is_read
                    ? "bg-primary/10 border-primary/40 hover:bg-primary/15"
                    : "bg-muted/30 border-transparent hover:bg-muted/50 opacity-70"
                )}
              >
                {/* Unread dot */}
                {!notification.is_read && (
                  <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary" />
                )}

                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
                  notification.is_read ? 'bg-muted text-muted-foreground' : config.color
                )}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5 pr-6">
                  <p className={cn(
                    "text-sm leading-snug",
                    !notification.is_read ? "text-foreground font-semibold" : "text-muted-foreground font-normal"
                  )}>
                    {notification.message}
                  </p>
                  <time className="text-xs text-muted-foreground/70 mt-1 block">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </time>
                </div>

                {/* Mark as read */}
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full absolute right-3 bottom-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate(notification.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}