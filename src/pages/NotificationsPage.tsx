import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications, isLoading, markAsRead } = useNotifications(user?.id);

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Notifications</h1>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 p-4 rounded-xl transition-colors ${
                n.is_read ? 'bg-background' : 'bg-column-bg'
              }`}
            >
              <div>
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
                  {format(new Date(n.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
              {!n.is_read && (
                <Button variant="ghost" size="sm" onClick={() => markAsRead.mutate(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
