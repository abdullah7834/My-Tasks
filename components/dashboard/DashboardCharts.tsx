interface DashboardChartsProps {
  statusCounts: Record<string, number>;
  totalTasks: number;
  dueCounts: {
    overdue: number;
    today: number;
    upcoming: number;
    noDue: number;
  };
  trend: Array<{ label: string; count: number }>;
}

const STATUS_LABELS: Array<{
  key: string;
  label: string;
  tone: string;
}> = [
  { key: "not_started", label: "Not started", tone: "bg-muted-foreground/30 text-muted-foreground" },
  { key: "in_progress", label: "In progress", tone: "bg-info text-info" },
  { key: "stopped_temporarily", label: "Stopped temporarily", tone: "bg-warning text-warning" },
  { key: "in_review", label: "In review", tone: "bg-warning text-warning" },
  { key: "done", label: "Completed", tone: "bg-success text-success" },
  { key: "cancelled", label: "Cancelled", tone: "bg-danger text-danger" },
];

export default function DashboardCharts({ statusCounts, totalTasks, dueCounts, trend }: DashboardChartsProps) {
  const maxTrend = Math.max(...trend.map((item) => item.count), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Task insights
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              Status breakdown
            </h2>
          </div>
          <p className="text-sm font-medium text-foreground/70">{totalTasks} total</p>
        </div>

        <div className="space-y-3">
          {STATUS_LABELS.map((status) => {
            const count = statusCounts[status.key] ?? 0;
            const width = totalTasks > 0 ? `${Math.max((count / totalTasks) * 100, 2)}%` : "2%";
            return (
              <div key={status.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{status.label}</span>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div className={`h-full rounded-full ${status.tone}`} style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Due summary
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Today & upcoming</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Overdue", value: dueCounts.overdue, tone: "text-danger" },
              { label: "Today", value: dueCounts.today, tone: "text-foreground" },
              { label: "Upcoming", value: dueCounts.upcoming, tone: "text-warning" },
              { label: "No due date", value: dueCounts.noDue, tone: "text-muted-foreground" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3">
                <span className={`text-sm font-medium ${item.tone}`}>{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Activity trend
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Updated tasks</h2>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Most recent activity</span>
                <span>{trend.reduce((sum, row) => sum + row.count, 0)} updates</span>
              </div>
              <div className="h-40 grid gap-2 items-end">
                <div className="grid h-full grid-cols-7 items-end gap-2">
                  {trend.map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-2">
                      <div className="relative flex h-full w-full items-end">
                        <div className="h-full w-full rounded-full bg-muted/50" />
                        <div
                          className="absolute bottom-0 w-full rounded-full bg-foreground"
                          style={{ height: `${(item.count / maxTrend) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
