"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  total_time_minutes: number;
  created_at?: string | null;
  updated_at?: string | null;
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
    total_time_minutes: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  projects: ProjectOption[];
  selectedFilter?: "all" | "completed" | "in-progress" | "in-review" | "cancelled";
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "started", label: "Started" },
  { value: "in_progress", label: "In progress" },
  { value: "stopped_temporarily", label: "Stopped temporarily" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-muted-foreground/40",
  started: "bg-blue-400",
  in_progress: "bg-info",
  stopped_temporarily: "bg-warning",
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

export function TaskTable({ initialTasks, projects, selectedFilter = "all" }: TaskTableProps) {
  const [rows, _setRows] = useState<TaskRow[]>(
    initialTasks.map((t) => ({
      ...t,
      description: t.description ?? null,
      due_date: t.due_date ? new Date(t.due_date) : null,
      start_time: normalizeTime(t.start_time),
      end_time: normalizeTime(t.end_time),
      total_time_minutes: t.total_time_minutes ?? 0,
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
      isNew: false,
    })),
  );
  const [panelRowId, setPanelRowId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const savingIdsRef = useRef<Set<string>>(new Set());
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(new Set());
  const [panelLogs, setPanelLogs] = useState<TaskLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const runningStartRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const rowsRef = useRef<TaskRow[]>(rows);

  // Wrapper that updates rowsRef SYNCHRONOUSLY before scheduling the React
  // state update. React 18 batches/queues updater functions and only invokes
  // them when flushing the batch (after the event handler completes), so we
  // can't rely on the updater body to keep rowsRef current. Instead we compute
  // `next` from rowsRef.current immediately, update the ref, and pass the
  // resolved array to _setRows — so queueSave(id, 0) right after setRows
  // always reads the latest data.
  const setRows = useCallback(
    (updater: TaskRow[] | ((curr: TaskRow[]) => TaskRow[])) => {
      const next =
        typeof updater === "function" ? updater(rowsRef.current) : updater;
      rowsRef.current = next;
      _setRows(next);
    },
    [],
  );
  const RUNNING_ID_KEY = "task_timer_running_id";
  const RUNNING_START_KEY = "task_timer_start_at";
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const savedTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Tracks temp IDs that have been successfully committed to the DB (POST completed).
  // Prevents stale closures from firing a second POST after the first save finishes.
  const committedTempIds = useRef(new Set<string>());
  // Maps old temp ID → real UUID, so stale closures can resolve to the current row.
  const tempToRealIdRef = useRef(new Map<string, string>());

  useEffect(() => {
    const savePendingRow = async (id: string) => {
      const row = rowsRef.current.find((r) => r.id === id);
      if (!row || !row.title.trim()) return;

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
        total_time_minutes: row.total_time_minutes,
      };

      try {
        await fetch("/api/tasks", {
          method: row.isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Ignore failed save during unmount
      }
    };

    return () => {
      mountedRef.current = false;
      const pendingIds = Array.from(timers.current.keys());
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      savedTimers.current.forEach(clearTimeout);
      savedTimers.current.clear();
      pendingIds.forEach((id) => {
        void savePendingRow(id);
      });
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedId = window.sessionStorage.getItem(RUNNING_ID_KEY);
    const storedStart = window.sessionStorage.getItem(RUNNING_START_KEY);
    if (!storedId || !storedStart) return;

    const startAt = Number(storedStart);
    if (Number.isNaN(startAt)) return;

    const row = rows.find((r) => r.id === storedId);
    if (!row) {
      // The active task may be filtered out on the current page,
      // so keep the persisted timer values until it reappears.
      return;
    }

    const isRunningTask =
      row.status === "in_progress" ||
      row.status === "started" ||
      (row.start_time && !row.end_time && row.status !== "done");
    if (!isRunningTask) {
      window.sessionStorage.removeItem(RUNNING_ID_KEY);
      window.sessionStorage.removeItem(RUNNING_START_KEY);
      return;
    }

    setRunningId(storedId);
    runningStartRef.current = startAt;
    setNow(Date.now());
  }, [rows]);

  // Tick once a second while a row is running — drives the live duration display.
  useEffect(() => {
    if (!runningId) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningId]);

  useEffect(() => {
    if (!panelRowId) {
      setPanelLogs([]);
      return;
    }
    fetchLogs(panelRowId);
  }, [panelRowId]);

  const setSaving = (id: string, on: boolean) => {
    if (on) savingIdsRef.current.add(id);
    else savingIdsRef.current.delete(id);
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

  const saveRow = async (row: TaskRow): Promise<TaskRow | null> => {
    if (!row.title.trim()) return null;

    // Stale closure guard: if a temp row was already committed to the DB by a
    // previous save, redirect to the real row and PATCH instead of POSTing again.
    if (row.isNew && committedTempIds.current.has(row.id)) {
      const realId = tempToRealIdRef.current.get(row.id);
      if (realId) {
        const realRow = rowsRef.current.find((r) => r.id === realId);
        if (realRow) return saveRow(realRow);
      }
      return null;
    }

    if (savingIdsRef.current.has(row.id)) return null;

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
      total_time_minutes: row.total_time_minutes,
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
        if (row.isNew) {
          // Record the committed temp ID so any concurrent stale closure can
          // resolve to the real row instead of firing a second POST.
          committedTempIds.current.add(row.id);
          tempToRealIdRef.current.set(row.id, saved.id);

          // Migrate any pending debounce timer from old temp key to real UUID.
          const existingTimer = timers.current.get(row.id);
          if (existingTimer) {
            timers.current.set(saved.id, existingTimer);
            timers.current.delete(row.id);
          }
        }

        if (mountedRef.current) {
          // Preserve local edits (project, status, priority etc.) that the user
          // may have changed while the POST was in-flight. Only update the fields
          // that the server owns: id, isNew flag, and timestamps.
          setRows((curr) =>
            curr.map((r) =>
              r.id === row.id
                ? { ...r, id: saved.id, isNew: false, created_at: saved.created_at, updated_at: saved.updated_at }
                : r,
            ),
          );
        }
        flashSaved(saved.id);
        return rowsRef.current.find((r) => r.id === saved.id) ?? { ...row, id: saved.id, isNew: false };
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSaving(row.id, false);
    }
    return null;
  };

  const queueSave = (id: string, delay: number) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);

    const doSave = () => {
      timers.current.delete(id);
      const row = rowsRef.current.find((r) => r.id === id);
      if (row) saveRow(row);
    };

    if (delay === 0) {
      doSave();
      return;
    }

    timers.current.set(id, setTimeout(doSave, delay));
  };

  const fetchLogs = async (taskId: string) => {
    // tempIds are not real UUIDs — the task hasn't been saved to the DB yet.
    if (taskId.startsWith("temp-")) return;
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/task-logs?taskId=${taskId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not load logs");
      setPanelLogs(result.logs ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const createLog = async (
    taskId: string,
    eventType: string,
    durationMinutes: number | null,
    note: string,
  ) => {
    try {
      const res = await fetch("/api/task-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          event_type: eventType,
          duration_minutes: durationMinutes,
          note,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not save log");
      if (result.log) {
        setPanelLogs((prev) => [...prev, result.log]);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save task log");
    }
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
    if (rowsRef.current.some((r) => r.isNew)) {
      toast.info("Save the current new task before adding another.");
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
        total_time_minutes: 0,
        isNew: true,
      },
      ...curr,
    ]);
  };

  // Auto-stamp times based on status transitions.
  // - Moving to "in_progress" stamps start_time if empty.
  // - Moving to "done" stamps end_time if empty (and stops the live timer if running).
  // Manual entries are preserved.
  const finishTask = (row: TaskRow) => {
    const endedAt = nowAsHHMM();
    const segmentDuration = durationMinutes(row.start_time, endedAt) ?? 0;

    setRunningId(null);
    runningStartRef.current = null;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(RUNNING_ID_KEY);
      window.sessionStorage.removeItem(RUNNING_START_KEY);
    }
    setRows((curr) =>
      curr.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: "done",
              end_time: endedAt,
              total_time_minutes:
                r.status === "in_progress"
                  ? r.total_time_minutes + segmentDuration
                  : r.total_time_minutes,
            }
          : r,
      ),
    );
    createLog(row.id, "done", segmentDuration, "Completed");
    queueSave(row.id, 0);
  };

  const handleStatusChange = (idArg: string, newStatus: string) => {
    const id = tempToRealIdRef.current.get(idArg) ?? idArg;
    const row = rowsRef.current.find((r) => r.id === id);
    if (!row) return;

    if (newStatus === "in_progress" || newStatus === "started") {
      startTimer(row);
      return;
    }

    if (newStatus === "stopped_temporarily") {
      if (runningId === id) {
        pauseTimer(row);
        return;
      }
      setRows((curr) =>
        curr.map((r) =>
          r.id === id ? { ...r, status: "stopped_temporarily" } : r,
        ),
      );
      queueSave(id, 0);
      return;
    }

    if (newStatus === "done") {
      if (runningId === id) {
        finishTask(row);
        return;
      }
      if (row.status === "in_progress" && row.start_time && !row.end_time) {
        const endedAt = nowAsHHMM();
        const segmentDuration = durationMinutes(row.start_time, endedAt) ?? 0;
        setRows((curr) =>
          curr.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "done",
                  end_time: endedAt,
                  total_time_minutes: r.total_time_minutes + segmentDuration,
                }
              : r,
          ),
        );
        createLog(id, "done", segmentDuration, "Completed");
        queueSave(id, 0);
        return;
      }
    }

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
    if (newStatus === "cancelled") {
      createLog(id, "cancelled", null, "Cancelled");
    }
    queueSave(id, 0);
  };

  const del = async (rowArg: TaskRow) => {
    const resolvedId = tempToRealIdRef.current.get(rowArg.id) ?? rowArg.id;
    const row = rowsRef.current.find((r) => r.id === resolvedId) ?? rowArg;
    if (runningId === row.id) {
      setRunningId(null);
      runningStartRef.current = null;
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(RUNNING_ID_KEY);
        window.sessionStorage.removeItem(RUNNING_START_KEY);
      }
    }
    // Cancel any pending debounce timers for this row.
    const pendingTimer = timers.current.get(row.id);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      timers.current.delete(row.id);
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

  const startTimer = async (rowArg: TaskRow) => {
    // Resolve stale closures: if the temp row was already saved, use the real row.
    const resolvedId = tempToRealIdRef.current.get(rowArg.id) ?? rowArg.id;
    let row = rowsRef.current.find((r) => r.id === resolvedId) ?? rowArg;

    if (!row.title.trim()) {
      toast.error("Add a title before starting the timer.");
      return;
    }

    if (row.isNew) {
      const saved = await saveRow(row);
      if (!saved) return;
      row = saved;
    }

    // If another row is currently timing, fully pause it first.
    if (runningId && runningId !== row.id) {
      const stoppedAt = nowAsHHMM();
      const prevRow = rowsRef.current.find((r) => r.id === runningId);
      if (prevRow) {
        const segmentDuration = durationMinutes(prevRow.start_time, stoppedAt) ?? 0;
        setRows((curr) =>
          curr.map((r) =>
            r.id === runningId
              ? {
                  ...r,
                  status: "stopped_temporarily",
                  end_time: stoppedAt,
                  total_time_minutes: r.total_time_minutes + segmentDuration,
                }
              : r,
          ),
        );
        createLog(runningId, "stopped_temporarily", segmentDuration, "Paused");
        queueSave(runningId, 0);
      }
    }

    const startAt = new Date();
    runningStartRef.current = startAt.getTime();
    setRunningId(row.id);
    setNow(startAt.getTime());

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(RUNNING_ID_KEY, row.id);
      window.sessionStorage.setItem(RUNNING_START_KEY, String(startAt.getTime()));
    }

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
    if (row.status === "stopped_temporarily") {
      // Task was paused — resume it
      createLog(row.id, "resumed", null, "Resumed");
      updateField(row.id, "status", "in_progress", "now");
    } else if (row.status !== "in_progress" && row.status !== "started") {
      // First-ever start from not_started (or any other idle state)
      createLog(row.id, "started", null, "Started");
      updateField(row.id, "status", "started", "now");
    } else {
      // Already marked started/in_progress — just persist the new timing
      queueSave(row.id, 0);
    }
  };

  const pauseTimer = (row: TaskRow) => {
    const stoppedAt = nowAsHHMM();
    const segmentDuration = durationMinutes(row.start_time, stoppedAt) ?? 0;

    setRunningId(null);
    runningStartRef.current = null;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(RUNNING_ID_KEY);
      window.sessionStorage.removeItem(RUNNING_START_KEY);
    }

    setRows((curr) =>
      curr.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: "stopped_temporarily",
              end_time: stoppedAt,
              total_time_minutes: r.total_time_minutes + segmentDuration,
            }
          : r,
      ),
    );
    createLog(row.id, "stopped_temporarily", segmentDuration, "Paused");
    queueSave(row.id, 0);
  };

  const dup = (row: TaskRow) => {
    const newRow: TaskRow = { ...row, id: tempId(), title: `${row.title} (copy)`, isNew: true };
    setRows((curr) => [newRow, ...curr]);
    saveRow(newRow);
  };

  const panelRow = panelRowId
    ? rows.find((r) => r.id === panelRowId) ?? null
    : null;
  const displayedRows = rows.filter((row) => {
    switch (selectedFilter) {
      case "completed":
        return row.status === "done";
      case "in-progress":
        return row.status === "in_progress";
      case "in-review":
        return row.status === "in_review";
      case "cancelled":
        return row.status === "cancelled";
      case "all":
      default:
        return row.status !== "done" && row.status !== "cancelled";
    }
  });
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
              <th className="w-px px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm text-muted-foreground"
                >
                  No tasks yet. Click "Add task" to start.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => {
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
                          onClick={() => { if (!row.isNew) setPanelRowId(row.id); }}
                          aria-label="Open task details"
                          disabled={row.isNew}
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 disabled:pointer-events-none disabled:opacity-30"
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
      logs={panelLogs}
      logsLoading={logsLoading}
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
