import Link from "next/link";
import { LayoutList, Layers } from "lucide-react";
import { TaskTable } from "@/components/shared/TaskTable";
import { CompletedTaskGroups } from "@/components/shared/CompletedTaskGroups";
import { ProjectTaskGroups } from "@/components/shared/ProjectTaskGroups";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";

export type TaskFilterKey = "all" | "completed" | "in-progress" | "in-review" | "cancelled";
export type TaskViewKey = "list" | "project";

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
  currentView = "list",
  taskCount = 0,
  currentPage = 1,
}: {
  projects: ProjectOption[];
  tasks: TaskItem[];
  selectedFilter: TaskFilterKey;
  currentView?: TaskViewKey;
  taskCount?: number;
  currentPage?: number;
}) {
  const selectedFilterLabel =
    FILTERS.find((f) => f.key === selectedFilter)?.label ?? "All tasks";

  const headline =
    taskCount === 0
      ? "Nothing here yet"
      : taskCount === tasks.length
      ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} across ${projects.length} ${projects.length === 1 ? "project" : "projects"}`
      : `Showing ${tasks.length} of ${taskCount} ${taskCount === 1 ? "task" : "tasks"} across ${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(taskCount / pageSize));
  const baseHref =
    selectedFilter === "all"
      ? "/dashboard/tasks"
      : `/dashboard/tasks/${selectedFilter}`;

  // Build view-toggle hrefs (preserve current filter, reset to page 1)
  const listHref = baseHref;
  const projectHref = `${baseHref}?view=project`;

  const pageHref = (page: number) =>
    currentView === "project"
      ? `${baseHref}?view=project&page=${page}`
      : `${baseHref}?page=${page}`;

  // Which content to show
  const showProjectView = currentView === "project";
  const showDateGrouped = selectedFilter === "completed" && !showProjectView;
  const showPagination =
    !showProjectView &&
    selectedFilter !== "completed" &&
    taskCount > pageSize;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {selectedFilterLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{headline}</p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Filter nav + view toggle on the same row */}
      <div className="flex items-center gap-3">
        <nav className="flex-1 overflow-x-auto rounded-2xl border border-border bg-card px-3 py-3">
          <div className="flex gap-2 min-w-max">
            {FILTERS.map((filter) => {
              const active = filter.key === selectedFilter;
              // When switching filter, drop view=project so we stay on list view
              // unless user explicitly chooses it again; keeps UX simple
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

        {/* View toggle — only on completed */}
        {selectedFilter === "completed" && <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-border bg-card p-1.5">
          <Link
            href={listHref}
            aria-label="List view"
            title="List view"
            className={`grid size-8 place-items-center rounded-xl transition ${
              !showProjectView
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LayoutList size={15} strokeWidth={1.75} />
          </Link>
          <Link
            href={projectHref}
            aria-label="Project view"
            title="Project view"
            className={`grid size-8 place-items-center rounded-xl transition ${
              showProjectView
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Layers size={15} strokeWidth={1.75} />
          </Link>
        </div>}
      </div>

      {/* Task content */}
      {showProjectView ? (
        <ProjectTaskGroups
          initialTasks={tasks}
          projects={projects}
          selectedFilter={selectedFilter}
        />
      ) : showDateGrouped ? (
        <CompletedTaskGroups initialTasks={tasks} projects={projects} />
      ) : (
        <TaskTable
          initialTasks={tasks}
          projects={projects}
          selectedFilter={selectedFilter}
        />
      )}

      {/* Pagination — only for list view, non-completed filters */}
      {showPagination && (
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
