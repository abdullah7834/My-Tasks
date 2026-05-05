import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StatsCards from "@/components/dashboard/StatsCards";
import TaskForm from "@/components/dashboard/TaskForm";
import RecentTasks from "@/components/dashboard/RecentTasks";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
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

  const recent = (tasks as any[]).filter((t) => isActive(t.status)).slice(0, 6);

  const fullName =
    (session.user.user_metadata?.full_name as string | undefined) ?? null;
  const displayName =
    fullName?.trim() || session.user.email?.split("@")[0] || null;

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <RecentTasks tasks={recent as any} projects={projects as any} />
        </div>
        <div>
          <TaskForm projects={projects as any} />
        </div>
      </div>
    </div>
  );
}
