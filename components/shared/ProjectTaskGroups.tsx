"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, ChevronRight, PanelRightOpen, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TaskDetailPanel, type PanelTaskRow } from "./TaskDetailPanel";

interface ProjectOption {
  id: string;
  name: string;
  color?: string | null;
}

interface TaskRow extends PanelTaskRow {
  isNew?: boolean;
}

interface TaskLog {
  id: string;
  task_id: string;
  event_type: string;
  event_at: string;
  duration_minutes: number | null;
  note: string | null;
  created_at: string;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  projectColor: string | null;
  tasks: TaskRow[];
}

interface ProjectTaskGroupsProps {
  initialTasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    project_id: string;
    status: string;
    priority: string;
    due_date: string | null;
    start_time: string | null;
    end_time: string | null;
    total_time_minutes: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  projects: ProjectOption[];
  selectedFilter?: "all" | "completed" | "in-progress" | "in-review" | "cancelled";
}

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-blue-500",
  stopped_temporarily: "bg-amber-500",
  in_review: "bg-amber-500",
  done: "bg-green-500",
  cancelled: "bg-muted-foreground/30",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  stopped_temporarily: "Stopped",
  in_review: "In review",
  done: "Done",
  cancelled: "Cancelled",
};

const PRIORITY_COLOR: Record<string, string> = {
  none: "text-muted-foreground",
  low: "text-blue-500",
  medium: "text-amber-500",
  high: "text-red-500",
};

function groupByProject(tasks: TaskRow[], projects: ProjectOption[]): ProjectGroup[] {
  const map: Record<string, ProjectGroup> = {};

  for (const task of tasks) {
    if (!map[task.project_id]) {
      const proj = projects.find((p) => p.id === task.project_id);
      map[task.project_id] = {
        projectId: task.project_id,
        projectName: proj?.name ?? "Unknown project",
        projectColor: proj?.color ?? null,
        tasks: [],
      };
    }
    map[task.project_id].tasks.push(task);
  }

  return Object.values(map).sort((a, b) =>
    a.projectName.localeCompare(b.projectName),
  );
}

function formatDuration(mins: number | null): string {
  if (mins === null || mins === 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function durationMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function ProjectTaskGroups({
  initialTasks,
  projects,
  selectedFilter,
}: ProjectTaskGroupsProps) {
  const [rows, setRows] = useState<TaskRow[]>(() =>
    initialTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      project_id: t.project_id,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ? new Date(t.due_date) : null,
      start_time: t.start_time ?? "",
      end_time: t.end_time ?? "",
      total_time_minutes: t.total_time_minutes ?? 0,
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
    })),
  );

  const [panelRowId, setPanelRowId] = useState<string | null>(null);
  const [panelLogs, setPanelLogs] = useState<TaskLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  // All groups start expanded
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const rowsRef = useRef<TaskRow[]>(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    setRows(
      initialTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        project_id: t.project_id,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date ? new Date(t.due_date) : null,
        start_time: t.start_time ?? "",
        end_time: t.end_time ?? "",
        total_time_minutes: t.total_time_minutes ?? 0,
        created_at: t.created_at ?? null,
        updated_at: t.updated_at ?? null,
      })),
    );
  }, [initialTasks]);

  const toggleGroup = (projectId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const saveRow = useCallback(async (id: string) => {
    const row = rowsRef.current.find((r) => r.id === id);
    if (!row) return;
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          title: row.title.trim(),
          description: row.description ?? null,
          project_id: row.project_id,
          status: row.status,
          priority: row.priority,
          due_date: row.due_date
            ? (row.due_date as Date).toISOString().slice(0, 10)
            : null,
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          total_time_minutes: row.total_time_minutes,
        }),
      });
    } catch {
      // ignore
    }
  }, []);

  const queueSave = useCallback(
    (id: string, delay = 800) => {
      const existing = saveTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        saveTimers.current.delete(id);
        void saveRow(id);
      }, delay);
      saveTimers.current.set(id, t);
    },
    [saveRow],
  );

  const updateField = useCallback(
    (
      id: string,
      field: keyof TaskRow,
      value: string | Date | null,
      save: "now" | "debounce" | "none",
    ) => {
      setRows((curr) =>
        curr.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
      if (save === "now") queueSave(id, 0);
      else if (save === "debounce") queueSave(id, 800);
    },
    [queueSave],
  );

  const openPanel = useCallback(async (rowId: string) => {
    setPanelRowId(rowId);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/task-logs?taskId=${rowId}`);
      if (res.ok) {
        const data = await res.json();
        setPanelLogs(data.logs ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const del = useCallback(
    async (row: TaskRow) => {
      setRows((curr) => curr.filter((r) => r.id !== row.id));
      if (panelRowId === row.id) setPanelRowId(null);
      try {
        const res = await fetch(`/api/tasks?id=${row.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Task deleted");
      } catch {
        setRows((curr) => {
          if (curr.find((r) => r.id === row.id)) return curr;
          return [...curr, row];
        });
        toast.error("Failed to delete task");
      }
    },
    [panelRowId],
  );

  const groups = groupByProject(rows, projects);

  const panelRow = panelRowId
    ? rows.find((r) => r.id === panelRowId) ?? null
    : null;

  const panelStaticDuration = panelRow
    ? formatDuration(durationMinutes(panelRow.start_time, panelRow.end_time))
    : "—";

  if (groups.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-5 py-16 text-center text-sm text-muted-foreground">
          No tasks found.
        </div>
      </div>
    );
  }

  const isCompletedFilter = selectedFilter === "completed";

  return (
    <>
      <div className="space-y-3">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.projectId);

          return (
            <div
              key={group.projectId}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.projectId)}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/30"
              >
                {isCollapsed ? (
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-muted-foreground"
                  />
                ) : (
                  <ChevronDown
                    size={15}
                    className="shrink-0 text-muted-foreground"
                  />
                )}

                {/* Project color swatch */}
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: group.projectColor ?? "currentColor",
                    opacity: group.projectColor ? 1 : 0.3,
                  }}
                />

                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {group.projectName}
                </span>

                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {group.tasks.length}{" "}
                  {group.tasks.length === 1 ? "task" : "tasks"}
                </span>
              </button>

              {/* Task rows */}
              {!isCollapsed && (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 text-left">Task</th>
                        <th className="px-3 py-3 text-left">Status</th>
                        <th className="px-3 py-3 text-left">Priority</th>
                        <th className="px-3 py-3 text-left">Due</th>
                        <th className="w-px px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.tasks.map((row) => (
                        <tr
                          key={row.id}
                          className="group transition hover:bg-muted/30"
                        >
                          {/* Title */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden
                                className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[row.status] ?? "bg-muted-foreground/40"}`}
                              />
                              <span
                                className={
                                  isCompletedFilter
                                    ? "text-foreground/60 line-through"
                                    : "text-foreground"
                                }
                              >
                                {row.title || "Untitled task"}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3">
                            <span className="text-xs text-muted-foreground">
                              {STATUS_LABEL[row.status] ?? row.status}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="px-3 py-3">
                            <span
                              className={`text-xs capitalize ${PRIORITY_COLOR[row.priority] ?? "text-muted-foreground"}`}
                            >
                              {row.priority === "none" ? "—" : row.priority}
                            </span>
                          </td>

                          {/* Due date */}
                          <td className="px-3 py-3">
                            <span className="text-xs text-muted-foreground">
                              {row.due_date
                                ? format(row.due_date as Date, "MMM d")
                                : "—"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openPanel(row.id)}
                                aria-label="Open task details"
                                className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
                              >
                                <PanelRightOpen size={14} strokeWidth={1.75} />
                              </button>
                              <button
                                onClick={() => del(row)}
                                aria-label="Delete"
                                className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 group-hover:opacity-100 group-focus-within:opacity-100"
                              >
                                <Trash2 size={14} strokeWidth={1.75} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TaskDetailPanel
        row={panelRow}
        projects={projects}
        onClose={() => setPanelRowId(null)}
        onUpdateField={(id, field, value, save) =>
          updateField(id, field as keyof TaskRow, value, save)
        }
        onTitleBlur={(id) => queueSave(id, 0)}
        onStatusChange={(id, status) => updateField(id, "status", status, "now")}
        isRunning={false}
        liveDuration={null}
        staticDuration={panelStaticDuration}
        logs={panelLogs}
        logsLoading={logsLoading}
        onToggleTimer={() => {}}
      />
    </>
  );
}
