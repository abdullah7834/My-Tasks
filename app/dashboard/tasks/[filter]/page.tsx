import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TasksDashboard, type TaskFilterKey } from "@/components/dashboard/TasksDashboard";

export const dynamic = "force-dynamic";
const DEFAULT_PAGE_SIZE = 10;

const FILTERS: TaskFilterKey[] = [
  "all",
  "completed",
  "in-progress",
  "in-review",
  "cancelled",
];

const STATUS_MAP: Record<TaskFilterKey, string | null> = {
  all: null,
  completed: "done",
  "in-progress": "in_progress",
  "in-review": "in_review",
  cancelled: "cancelled",
};

export default async function TasksFilterPage({
  params,
  searchParams,
}: {
  params: { filter: string };
  searchParams?: Promise<{ page?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { filter } = params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const selectedFilter = FILTERS.includes(filter as TaskFilterKey)
    ? (filter as TaskFilterKey)
    : "all";

  if (!FILTERS.includes(selectedFilter)) {
    redirect("/dashboard/tasks");
  }

  const resolvedSearchParams = await searchParams;
  const page = Math.max(Number(resolvedSearchParams?.page ?? "1"), 1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const userId = user.id;
  const tasksQuery = supabase
    .from("tasks")
    .select(
      "id,title,description,status,priority,due_date,start_time,end_time,total_time_minutes,project_id,position,created_at,updated_at",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (STATUS_MAP[selectedFilter]) {
    tasksQuery.eq("status", STATUS_MAP[selectedFilter]);
  } else {
    tasksQuery.not("status", "in", "(done,cancelled)");
  }

  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,color")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    tasksQuery,
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
          selectedFilter={selectedFilter}
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
