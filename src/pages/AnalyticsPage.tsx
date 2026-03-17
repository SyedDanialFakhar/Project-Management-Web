import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import StatsCards from '@/components/analytics/StatsCards';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import LogsTable from '@/components/analytics/LogsTable';
import { useAnalyticsData } from '@/hooks/useAnalyticsData'; // ← see hook below

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const { logs, isLoading, loadMore, exportToCSV } = useAnalyticsData(dateRange);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl space-y-10">
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">Monitor projects, tasks and game activity</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">From</span>
            <Input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">To</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-40"
            />
          </div>
          {/* <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button> */}
        </div>
      </div>

      {isLoading && logs.length === 0 ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground text-lg">Loading analytics data...</div>
        </div>
      ) : (
        <div className="space-y-10">
          <StatsCards logs={logs} />
          <AnalyticsChart logs={logs} />
          <LogsTable logs={logs} onLoadMore={loadMore} hasMore={!!logs.length} />
        </div>
      )}
    </div>
  );
}