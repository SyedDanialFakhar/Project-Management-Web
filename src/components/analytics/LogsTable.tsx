import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogsTable({ logs, loadMore }: { logs: any[]; loadMore: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Event</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition">
                  <td className="py-3 px-4">{log.users?.email || log.user_id?.slice(0,8) + "..."}</td>
                  <td className="py-3 px-4">{log.event_type}</td>
                  <td className="py-3 px-4 font-mono">{log.event_value}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={loadMore}
          className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
        >
          Load More
        </button>
      </CardContent>
    </Card>
  );
}