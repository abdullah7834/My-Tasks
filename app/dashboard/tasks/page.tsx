import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TasksDashboard } from "@/components/dashboard/TasksDashboard";

export const dynamic = "force-dynamic";
const DEFAULT_PAGE_SIZE = 10;

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const page = Math.max(Number(resolvedSearchParams?.page ?? "1"), 1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const userId = user.id;

  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,color")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select(
        "id,title,description,status,priority,due_date,start_time,end_time,total_time_minutes,project_id,position,created_at,updated_at",
        { count: "exact" },
      )
      .eq("user_id", userId)
      .not("status", "in", "(done,cancelled)")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1),
  ]);

  const projects = (projectsRes.data ?? []) as {
    id: string;
    name: string;
    color: string | null;
  }[];
  const tasks = (tasksRes.data ?? []) as {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    start_time: string | null;
    end_time: string | null;
    total_time_minutes: number | null;
    project_id: string;
    created_at: string | null;
    updated_at: string | null;
  }[];
  const taskCount = tasksRes.count ?? 0;

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="text-base font-medium tracking-tight text-foreground">
            Create your first project
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Group related tasks into projects. Click &quot;New project&quot; above to get
            started.
          </p>
        </div>
      ) : (
        <TasksDashboard
          selectedFilter="all"
          tasks={tasks}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
          }))}
          taskCount={taskCount}
          currentPage={page}
        />
      )}
    </div>
  );
}
