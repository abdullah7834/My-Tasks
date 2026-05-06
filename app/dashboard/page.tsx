import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StatsCards from "@/components/dashboard/StatsCards";
import TaskForm from "@/components/dashboard/TaskForm";
import RecentTasks from "@/components/dashboard/RecentTasks";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const today = new Date().toISOString().slice(0, 10);

  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,color")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,project_id,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const projects = projectsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const isActive = (s: string) => s !== "done" && s !== "cancelled";

  const stats = {
    today: tasks.filter((t: any) => t.due_date === today && isActive(t.status))
      .length,
    completed: tasks.filter((t: any) => t.status === "done").length,
    upcoming: tasks.filter(
      (t: any) => t.due_date && t.due_date > today && isActive(t.status),
    ).length,
    total: tasks.length,
  };

  const activeTasks = (tasks as any[])
    .filter((t) => isActive(t.status))
    .slice(0, 5);

  const statusCounts = {
    not_started: tasks.filter((t: any) => t.status === "not_started").length,
    in_progress: tasks.filter((t: any) => t.status === "in_progress").length,
    stopped_temporarily: tasks.filter((t: any) => t.status === "stopped_temporarily").length,
    in_review: tasks.filter((t: any) => t.status === "in_review").length,
    done: tasks.filter((t: any) => t.status === "done").length,
    cancelled: tasks.filter((t: any) => t.status === "cancelled").length,
  };

  const dueCounts = (tasks as any[]).reduce(
    (acc, task) => {
      if (!isActive(task.status)) return acc;
      if (!task.due_date) {
        acc.noDue += 1;
      } else if (task.due_date < today) {
        acc.overdue += 1;
      } else if (task.due_date === today) {
        acc.today += 1;
      } else {
        acc.upcoming += 1;
      }
      return acc;
    },
    { overdue: 0, today: 0, upcoming: 0, noDue: 0 },
  );

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const key = date.toISOString().slice(0, 10);
    const count = (tasks as any[]).filter(
      (task) => task.updated_at?.slice(0, 10) === key,
    ).length;
    return { label, count };
  });

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? null;
  const displayName =
    fullName?.trim() || user.email?.split("@")[0] || null;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {displayName ? `Welcome back, ${displayName}.` : "Welcome back."}
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground">
          Here's what's on your plate today.
        </p>
      </header>

      <StatsCards stats={stats} />

      <DashboardCharts
        statusCounts={statusCounts}
        totalTasks={tasks.length}
        dueCounts={dueCounts}
        trend={trend}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <RecentTasks tasks={activeTasks as any} projects={projects as any} />
        </div>
        <div>
          <TaskForm projects={projects as any} />
        </div>
      </div>
    </div>
  );
}
