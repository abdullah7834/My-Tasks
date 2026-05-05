import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import {
  ProjectsList,
  type ProjectListItem,
} from "@/components/projects/ProjectsList";
import { FolderPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,description,color,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("project_id")
      .eq("user_id", userId),
  ]);

  const counts = new Map<string, number>();
  for (const t of (tasksRes.data ?? []) as { project_id: string }[]) {
    counts.set(t.project_id, (counts.get(t.project_id) ?? 0) + 1);
  }

  const projects: ProjectListItem[] = (
    (projectsRes.data ?? []) as Array<{
      id: string;
      name: string;
      description: string | null;
      color: string | null;
    }>
  ).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    taskCount: counts.get(p.id) ?? 0,
  }));

  const summary =
    projects.length === 0
      ? "No projects yet"
      : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
        <CreateProjectDialog />
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <FolderPlus size={18} strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-base font-medium tracking-tight text-foreground">
            Create your first project
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Projects group related tasks. Click "New project" above to get
            started.
          </p>
        </div>
      ) : (
        <ProjectsList projects={projects} />
      )}
    </div>
  );
}
