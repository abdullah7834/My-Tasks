import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TaskTable } from "@/components/shared/TaskTable";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,color")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select(
        "id,title,description,status,priority,due_date,start_time,end_time,project_id,position,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("position", { ascending: true }),
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
    project_id: string;
    created_at: string | null;
    updated_at: string | null;
  }[];

  const headline =
    tasks.length === 0
      ? "Nothing here yet"
      : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} across ${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            All tasks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{headline}</p>
        </div>
        <CreateProjectDialog />
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="text-base font-medium tracking-tight text-foreground">
            Create your first project
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Group related tasks into projects. Click "New project" above to get
            started.
          </p>
        </div>
      ) : (
        <TaskTable
          initialTasks={tasks}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
          }))}
        />
      )}
    </div>
  );
}
