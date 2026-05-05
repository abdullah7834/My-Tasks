import { Clock, CheckCircle2, CalendarDays, ListChecks } from "lucide-react";

interface Stats {
  today: number;
  completed: number;
  upcoming: number;
  total: number;
}

export default function StatsCards({ stats }: { stats: Stats }) {
  const items = [
    {
      label: "Due today",
      value: stats.today,
      icon: Clock,
      tone: "text-foreground",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      tone: "text-success",
    },
    {
      label: "Upcoming",
      value: stats.upcoming,
      icon: CalendarDays,
      tone: "text-warning",
    },
    {
      label: "All tasks",
      value: stats.total,
      icon: ListChecks,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
              <Icon size={15} strokeWidth={1.75} className={item.tone} />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
