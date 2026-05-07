import Link from "next/link";
import { TaskTable } from "@/components/shared/TaskTable";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";

export type TaskFilterKey = "all" | "completed" | "in-progress" | "in-review" | "cancelled";

export interface ProjectOption {
  id: string;
  name: string;
  color?: string | null;
}

export interface TaskItem {
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
}

const FILTERS: Array<{ key: TaskFilterKey; label: string; href: string }> = [
  { key: "all", label: "All tasks", href: "/dashboard/tasks" },
  { key: "completed", label: "Completed tasks", href: "/dashboard/tasks/completed" },
  { key: "in-progress", label: "In progress", href: "/dashboard/tasks/in-progress" },
  { key: "in-review", label: "In review", href: "/dashboard/tasks/in-review" },
  { key: "cancelled", label: "Cancelled", href: "/dashboard/tasks/cancelled" },
];

const DEFAULT_PAGE_SIZE = 10;

export function TasksDashboard({
  projects,
  tasks,
  selectedFilter,
  taskCount = 0,
  currentPage = 1,
}: {
  projects: ProjectOption[];
  tasks: TaskItem[];
  selectedFilter: TaskFilterKey;
  taskCount?: number;
  currentPage?: number;
}) {
  const selectedFilterLabel =
    FILTERS.find((filter) => filter.key === selectedFilter)?.label ?? "All tasks";

  const headline =
    taskCount === 0
      ? "Nothing here yet"
      : taskCount === tasks.length
      ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} across ${projects.length} ${projects.length === 1 ? "project" : "projects"}`
      : `Showing ${tasks.length} of ${taskCount} ${taskCount === 1 ? "task" : "tasks"} across ${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(taskCount / pageSize));
  const baseHref = selectedFilter === "all" ? "/dashboard/tasks" : `/dashboard/tasks/${selectedFilter}`;

  const pageHref = (page: number) => `${baseHref}?page=${page}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {selectedFilterLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{headline}</p>
        </div>
        <CreateProjectDialog />
      </div>

      <nav className="overflow-x-auto rounded-2xl border border-border bg-card px-3 py-3">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map((filter) => {
            const active = filter.key === selectedFilter;
            return (
              <Link
                key={filter.key}
                href={filter.href}
                className={`inline-flex whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  active
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted/80"
                } ${active ? "cursor-default" : "cursor-pointer"}`}
                aria-current={active ? "page" : undefined}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <TaskTable initialTasks={tasks} projects={projects} selectedFilter={selectedFilter} />

      {taskCount > pageSize && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={pageHref(Math.max(1, currentPage - 1))}
              className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition ${
                currentPage <= 1
                  ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/80"
              }`}
              aria-disabled={currentPage <= 1}
            >
              Previous
            </Link>
            <Link
              href={pageHref(Math.min(totalPages, currentPage + 1))}
              className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition ${
                currentPage >= totalPages
                  ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/80"
              }`}
              aria-disabled={currentPage >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
