"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Plus,
  Trash2,
  Loader2,
  Check,
  Play,
  Pause,
  ChevronDown,
  PanelRightOpen,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import { TaskDetailPanel } from "./TaskDetailPanel";

interface ProjectOption {
  id: string;
  name: string;
  color?: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  status: string;
  priority: string;
  due_date: Date | null;
  start_time: string;
  end_time: string;
  created_at?: string | null;
  updated_at?: string | null;
  isNew?: boolean;
}

interface TaskTableProps {
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
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  projects: ProjectOption[];
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-info",
  in_review: "bg-warning",
  done: "bg-success",
  cancelled: "bg-muted-foreground/30",
};

const tempId = () =>
  `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function normalizeTime(t: string | null | undefined): string {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
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

function formatDuration(mins: number | null): string {
  if (mins === null || mins === 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function formatLive(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function nowAsHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TaskTable({ initialTasks, projects }: TaskTableProps) {
  const [rows, setRows] = useState<TaskRow[]>(
    initialTasks.map((t) => ({
      ...t,
      description: t.description ?? null,
      due_date: t.due_date ? new Date(t.due_date) : null,
      start_time: normalizeTime(t.start_time),
      end_time: normalizeTime(t.end_time),
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
      isNew: false,
    })),
  );
  const [panelRowId, setPanelRowId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(
    new Set(),
  );
  const [runningId, setRunningId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const runningStartRef = useRef<number | null>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const savedTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      savedTimers.current.forEach(clearTimeout);
    };
  }, []);

  // Tick once a second while a row is running — drives the live duration display.
  useEffect(() => {
    if (!runningId) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningId]);

  const setSaving = (id: string, on: boolean) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const flashSaved = (id: string) => {
    setRecentlySavedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const existing = savedTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setRecentlySavedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      savedTimers.current.delete(id);
    }, 1500);
    savedTimers.current.set(id, timer);
  };

  const saveRow = async (row: TaskRow) => {
    if (!row.title.trim()) return;

    const payload: Record<string, unknown> = {
      ...(row.isNew ? {} : { id: row.id }),
      title: row.title.trim(),
      description: row.description ?? null,
      project_id: row.project_id,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date ? row.due_date.toISOString().slice(0, 10) : null,
      start_time: row.start_time || null,
      end_time: row.end_time || null,
    };

    setSaving(row.id, true);
    try {
      const res = await fetch("/api/tasks", {
        method: row.isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not save");

      const saved = result.task;
      if (saved) {
        setRows((curr) =>
          curr.map((r) =>
            r.id === row.id
              ? {
                  ...saved,
                  due_date: saved.due_date ? new Date(saved.due_date) : null,
                  start_time: normalizeTime(saved.start_time),
                  end_time: normalizeTime(saved.end_time),
                  isNew: false,
                }
              : r,
          ),
        );
        flashSaved(saved.id);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSaving(row.id, false);
    }
  };

  const queueSave = (id: string, delay: number) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      timers.current.delete(id);
      setRows((curr) => {
        const row = curr.find((r) => r.id === id);
        if (row) saveRow(row);
        return curr;
      });
    }, delay);

    timers.current.set(id, timer);
  };

  const updateField = (
    id: string,
    field: keyof TaskRow,
    value: any,
    save: "now" | "debounce" | "none" = "debounce",
  ) => {
    setRows((curr) =>
      curr.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
    if (save === "now") queueSave(id, 0);
    else if (save === "debounce") queueSave(id, 700);
  };

  const addRow = () => {
    if (projects.length === 0) {
      toast.error("Create a project first.");
      return;
    }
    setRows((curr) => [
      {
        id: tempId(),
        title: "",
        description: null,
        project_id: projects[0]?.id ?? "",
        status: "not_started",
        priority: "none",
        due_date: null,
        start_time: "",
        end_time: "",
        isNew: true,
      },
      ...curr,
    ]);
  };

  // Auto-stamp times based on status transitions.
  // - Moving to "in_progress" stamps start_time if empty.
  // - Moving to "done" stamps end_time if empty (and stops the live timer if running).
  // Manual entries are preserved.
  const handleStatusChange = (id: string, newStatus: string) => {
    setRows((curr) =>
      curr.map((r) => {
        if (r.id !== id) return r;
        const patch: Partial<TaskRow> = { status: newStatus };
        if (newStatus === "in_progress" && !r.start_time) {
          patch.start_time = nowAsHHMM();
        }
        if (newStatus === "done" && !r.end_time) {
          patch.end_time = nowAsHHMM();
        }
        return { ...r, ...patch };
      }),
    );
    if (newStatus === "done" && runningId === id) {
      setRunningId(null);
      runningStartRef.current = null;
    }
    queueSave(id, 0);
  };

  const del = async (row: TaskRow) => {
    if (runningId === row.id) {
      setRunningId(null);
      runningStartRef.current = null;
    }
    if (row.isNew) {
      setRows((curr) => curr.filter((r) => r.id !== row.id));
      return;
    }
    try {
      const res = await fetch(`/api/tasks?id=${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRows((curr) => curr.filter((r) => r.id !== row.id));
      toast.success("Deleted");
    } catch {
      toast.error("Could not delete");
    }
  };

  const startTimer = (row: TaskRow) => {
    if (!row.title.trim()) {
      toast.error("Add a title before starting the timer.");
      return;
    }

    // If another row is currently timing, pause it first.
    if (runningId && runningId !== row.id) {
      const stoppedAt = nowAsHHMM();
      setRows((curr) =>
        curr.map((r) =>
          r.id === runningId ? { ...r, end_time: stoppedAt } : r,
        ),
      );
      queueSave(runningId, 0);
    }

    const startAt = new Date();
    runningStartRef.current = startAt.getTime();
    setRunningId(row.id);
    setNow(startAt.getTime());

    setRows((curr) =>
      curr.map((r) =>
        r.id === row.id
          ? {
              ...r,
              start_time: nowAsHHMM(),
              end_time: "",
            }
          : r,
      ),
    );
    queueSave(row.id, 0);
  };

  const pauseTimer = (row: TaskRow) => {
    setRunningId(null);
    runningStartRef.current = null;

    setRows((curr) =>
      curr.map((r) =>
        r.id === row.id ? { ...r, end_time: nowAsHHMM() } : r,
      ),
    );
    queueSave(row.id, 0);
  };

  const dup = (row: TaskRow) =>
    setRows((curr) => [
      { ...row, id: tempId(), title: `${row.title} (copy)`, isNew: true },
      ...curr,
    ]);

  const totalMinutes = rows.reduce(
    (sum, r) => sum + (durationMinutes(r.start_time, r.end_time) ?? 0),
    0,
  );

  const panelRow = panelRowId
    ? rows.find((r) => r.id === panelRowId) ?? null
    : null;
  const panelIsRunning = !!panelRow && runningId === panelRow.id;
  const panelLiveDuration =
    panelIsRunning && runningStartRef.current !== null
      ? formatLive(now - runningStartRef.current)
      : null;
  const panelStaticDuration = panelRow
    ? formatDuration(durationMinutes(panelRow.start_time, panelRow.end_time))
    : "—";

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            Tasks
          </h2>
          <p className="text-xs text-muted-foreground">
            Click any cell to edit. Changes save automatically.
          </p>
        </div>
        <button
          onClick={addRow}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition hover:bg-foreground/90 active:translate-y-px"
        >
          <Plus size={14} strokeWidth={2} />
          Add task
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-left">Task</th>
              <th className="px-3 py-3 text-left">Project</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Priority</th>
              <th className="px-3 py-3 text-left">Due</th>
              <th className="px-3 py-3 text-left">Start</th>
              <th className="px-3 py-3 text-left">End</th>
              <th className="px-3 py-3 text-left">Duration</th>
              <th className="w-px px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-16 text-center text-sm text-muted-foreground"
                >
                  No tasks yet. Click "Add task" to start.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSaving = savingIds.has(row.id);
                const justSaved = recentlySavedIds.has(row.id);
                const dur = durationMinutes(row.start_time, row.end_time);
                return (
                  <tr
                    key={row.id}
                    className="group transition hover:bg-muted/30"
                  >
                    <td className="px-5 py-2.5">
                      <input
                        value={row.title}
                        onChange={(e) =>
                          updateField(row.id, "title", e.target.value, "none")
                        }
                        onBlur={() => queueSave(row.id, 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder="Untitled task"
                        className="w-full cursor-text bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <CellSelect
                        value={row.project_id}
                        onChange={(value) =>
                          updateField(row.id, "project_id", value, "now")
                        }
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </CellSelect>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-1.5 shrink-0 rounded-full ${
                            STATUS_DOT[row.status] ?? "bg-muted-foreground/40"
                          }`}
                        />
                        <CellSelect
                          value={row.status}
                          onChange={(value) =>
                            handleStatusChange(row.id, value)
                          }
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </CellSelect>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <CellSelect
                        capitalize
                        value={row.priority}
                        onChange={(value) =>
                          updateField(row.id, "priority", value, "now")
                        }
                      >
                        {PRIORITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </CellSelect>
                    </td>

                    <td className="px-3 py-2.5">
                      <DatePicker
                        selected={row.due_date}
                        onChange={(d: Date | null) =>
                          updateField(row.id, "due_date", d, "now")
                        }
                        dateFormat="MMM d"
                        placeholderText="—"
                        className="w-full cursor-pointer bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(e) =>
                          updateField(
                            row.id,
                            "start_time",
                            e.target.value,
                            "now",
                          )
                        }
                        className="w-full cursor-pointer bg-transparent font-mono text-xs tabular-nums text-foreground outline-none"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <input
                        type="time"
                        value={row.end_time}
                        onChange={(e) =>
                          updateField(row.id, "end_time", e.target.value, "now")
                        }
                        className="w-full cursor-pointer bg-transparent font-mono text-xs tabular-nums text-foreground outline-none"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      {(() => {
                        const isRunning = runningId === row.id;
                        const liveMs =
                          isRunning && runningStartRef.current !== null
                            ? now - runningStartRef.current
                            : 0;
                        return (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                isRunning ? pauseTimer(row) : startTimer(row)
                              }
                              aria-label={
                                isRunning ? "Pause timer" : "Start timer"
                              }
                              className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition active:scale-95 ${
                                isRunning
                                  ? "bg-danger text-danger-foreground hover:bg-danger/90"
                                  : "bg-muted text-foreground hover:bg-foreground hover:text-background"
                              }`}
                            >
                              {isRunning ? (
                                <Pause
                                  size={10}
                                  strokeWidth={0}
                                  fill="currentColor"
                                />
                              ) : (
                                <Play
                                  size={10}
                                  strokeWidth={0}
                                  fill="currentColor"
                                  className="translate-x-px"
                                />
                              )}
                            </button>
                            {isRunning ? (
                              <span className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-medium tabular-nums text-foreground">
                                  {formatLive(liveMs)}
                                </span>
                                <span
                                  aria-hidden
                                  className="size-1.5 animate-pulse rounded-full bg-danger"
                                />
                              </span>
                            ) : (
                              <span
                                className={`font-mono text-xs tabular-nums ${
                                  dur === null
                                    ? "text-muted-foreground/60"
                                    : "text-foreground"
                                }`}
                              >
                                {formatDuration(dur)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-5 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <span
                          aria-hidden
                          className="mr-1 inline-flex size-4 items-center justify-center text-muted-foreground"
                        >
                          {isSaving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : justSaved ? (
                            <Check size={12} className="text-success" />
                          ) : null}
                        </span>
                        <button
                          onClick={() => setPanelRowId(row.id)}
                          aria-label="Open task details"
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
                        >
                          <PanelRightOpen size={14} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => dup(row)}
                          aria-label="Duplicate"
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
                        >
                          <Copy size={14} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => del(row)}
                          aria-label="Delete"
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-danger-muted hover:text-danger group-hover:opacity-100 group-focus-within:opacity-100"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td
                  colSpan={7}
                  className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Total scheduled
                </td>
                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                    {formatDuration(totalMinutes || null)}
                  </span>
                </td>
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
    <TaskDetailPanel
      row={panelRow}
      projects={projects}
      onClose={() => setPanelRowId(null)}
      onUpdateField={(id, field, value, save) =>
        updateField(id, field as keyof TaskRow, value, save)
      }
      onTitleBlur={(id) => queueSave(id, 0)}
      onStatusChange={handleStatusChange}
      isRunning={panelIsRunning}
      liveDuration={panelLiveDuration}
      staticDuration={panelStaticDuration}
      onToggleTimer={() => {
        if (!panelRow) return;
        if (panelIsRunning) pauseTimer(panelRow);
        else startTimer(panelRow);
      }}
    />
    </>
  );
}

function CellSelect({
  value,
  onChange,
  children,
  capitalize = false,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="relative flex items-center rounded-md border border-transparent transition hover:border-border focus-within:border-border">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full cursor-pointer appearance-none bg-transparent px-2 py-1 pr-6 text-foreground outline-none ${capitalize ? "capitalize" : ""}`}
      >
        {children}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={1.75}
        aria-hidden
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
