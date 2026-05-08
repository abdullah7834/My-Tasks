"use client";

import { useEffect } from "react";
import {
  X,
  Play,
  Pause,
  ChevronDown,
  Folder,
  Flag,
  CalendarDays,
  Clock,
  AlignLeft,
} from "lucide-react";
import { LoadingDots } from "./LoadingDots";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ProjectOption {
  id: string;
  name: string;
  color?: string | null;
}

export interface PanelTaskRow {
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
}

interface Props {
  row: PanelTaskRow | null;
  projects: ProjectOption[];
  onClose: () => void;
  onUpdateField: (
    id: string,
    field: keyof PanelTaskRow,
    value: string | Date | null,
    save: "now" | "debounce" | "none",
  ) => void;
  onTitleBlur: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isRunning: boolean;
  liveDuration: string | null;
  staticDuration: string;
  onToggleTimer: () => void;
  logs: Array<{ id: string; event_type: string; event_at: string; duration_minutes: number | null; note: string | null }>;
  logsLoading: boolean;
}

function formatDuration(mins: number | null): string {
  if (mins === null || mins === 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
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

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso);
  return then.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseLiveMinutes(value: string): number {
  const parts = value.split(":").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0;
  return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TaskDetailPanel({
  row,
  projects,
  onClose,
  onUpdateField,
  onTitleBlur,
  onStatusChange,
  isRunning,
  liveDuration,
  staticDuration,
  onToggleTimer,
  logs,
  logsLoading,
}: Props) {
  // Close on ESC
  useEffect(() => {
    if (!row) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [row, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!row) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [row]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-foreground/15 backdrop-blur-[2px] transition-opacity duration-200 ${
          row
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Task details"
        aria-hidden={!row}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-135 flex-col border-l border-border bg-card shadow-2xl shadow-foreground/10 transition-transform duration-300 ease-out ${
          row ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {row && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${
                      STATUS_DOT[row.status] ?? "bg-muted-foreground/40"
                    }`}
                  />
                  <span>
                    {STATUS_OPTIONS.find((s) => s.value === row.status)
                      ?.label ?? row.status}
                  </span>
                  {row.updated_at && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span>Updated {relativeTime(row.updated_at)}</span>
                    </>
                  )}
                </div>
                <input
                  value={row.title}
                  onChange={(e) =>
                    onUpdateField(row.id, "title", e.target.value, "none")
                  }
                  onBlur={() => onTitleBlur(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Untitled task"
                  className="mt-1 w-full cursor-text bg-transparent text-xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 px-6 py-6">
                {/* Description */}
                <section className="space-y-2">
                  <Label icon={AlignLeft}>Description</Label>
                  <textarea
                    value={row.description ?? ""}
                    onChange={(e) =>
                      onUpdateField(
                        row.id,
                        "description",
                        e.target.value,
                        "none",
                      )
                    }
                    onBlur={(e) =>
                      onUpdateField(row.id, "description", e.target.value, "now")
                    }
                    placeholder="Add a description…"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-foreground/40"
                  />
                </section>

                {/* Properties grid */}
                <section className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <Field icon={Flag} label="Status">
                    <PanelSelect
                      value={row.status}
                      onChange={(value) => onStatusChange(row.id, value)}
                      options={STATUS_OPTIONS}
                      leadingDot={
                        <span
                          aria-hidden
                          className={`size-1.5 shrink-0 rounded-full ${
                            STATUS_DOT[row.status] ?? "bg-muted-foreground/40"
                          }`}
                        />
                      }
                    />
                  </Field>

                  <Field icon={Flag} label="Priority">
                    <PanelSelect
                      value={row.priority}
                      onChange={(value) =>
                        onUpdateField(row.id, "priority", value, "now")
                      }
                      options={PRIORITY_OPTIONS}
                    />
                  </Field>

                  <Field icon={Folder} label="Project">
                    <PanelSelect
                      value={row.project_id}
                      onChange={(value) =>
                        onUpdateField(row.id, "project_id", value, "now")
                      }
                      options={projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                      leadingDot={
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            background:
                              projects.find((p) => p.id === row.project_id)
                                ?.color ?? "oklch(0.7 0 0)",
                          }}
                        />
                      }
                    />
                  </Field>

                  <Field icon={CalendarDays} label="Due date">
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition focus-within:border-foreground/40">
                      <DatePicker
                        selected={row.due_date}
                        onChange={(d: Date | null) =>
                          onUpdateField(row.id, "due_date", d, "now")
                        }
                        dateFormat="MMM d, yyyy"
                        placeholderText="Set a due date"
                        popperPlacement="bottom-end"
                        className="w-full cursor-pointer bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none"
                      />
                    </div>
                  </Field>
                </section>

                {/* Time tracking block */}
                <section className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Clock size={12} strokeWidth={1.75} />
                      Time tracking
                    </h3>
                    <button
                      type="button"
                      onClick={onToggleTimer}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition active:translate-y-px ${
                        isRunning
                          ? "bg-danger text-danger-foreground hover:bg-danger/90"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause
                            size={11}
                            strokeWidth={0}
                            fill="currentColor"
                          />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play
                            size={11}
                            strokeWidth={0}
                            fill="currentColor"
                          />
                          Start
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Start
                      </p>
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(e) =>
                          onUpdateField(
                            row.id,
                            "start_time",
                            e.target.value,
                            "now",
                          )
                        }
                        className="w-full cursor-pointer rounded-md border border-border bg-card px-2 py-1.5 font-mono text-xs tabular-nums text-foreground outline-none transition focus:border-foreground/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        End
                      </p>
                      <input
                        type="time"
                        value={row.end_time}
                        onChange={(e) =>
                          onUpdateField(
                            row.id,
                            "end_time",
                            e.target.value,
                            "now",
                          )
                        }
                        className="w-full cursor-pointer rounded-md border border-border bg-card px-2 py-1.5 font-mono text-xs tabular-nums text-foreground outline-none transition focus:border-foreground/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Duration
                      </p>
                      <div className="flex h-7.5 items-center gap-1.5 rounded-md border border-transparent bg-muted/40 px-2">
                        {isRunning && liveDuration ? (
                          <>
                            <span className="font-mono text-xs font-medium tabular-nums text-foreground">
                              {liveDuration}
                            </span>
                            <span
                              aria-hidden
                              className="size-1.5 animate-pulse rounded-full bg-danger"
                            />
                          </>
                        ) : (
                          <span className="font-mono text-xs tabular-nums text-foreground">
                            {staticDuration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Clock size={12} strokeWidth={1.75} />
                      Total tracked
                    </h3>
                  </div>
                  <div className="mt-4 rounded-md border border-border bg-card p-4 text-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Time recorded
                    </p>
                    <div className="mt-2 text-lg font-semibold text-foreground">
                      {formatDuration(
                        row.total_time_minutes +
                          (isRunning && liveDuration ? parseLiveMinutes(liveDuration) : 0),
                      )}
                    </div>
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Folder size={12} strokeWidth={1.75} />
                      Activity log
                    </h3>
                  </div>
                  {logsLoading ? (
                    <LoadingDots label="Loading logs" />
                  ) : logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-foreground capitalize">
                              {log.event_type.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(log.event_at)}
                            </p>
                          </div>
                          {log.duration_minutes !== null && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDuration(log.duration_minutes)}
                            </p>
                          )}
                          {log.note && (
                            <p className="mt-2 text-sm text-foreground">{log.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Footer */}
            {row.created_at && (
              <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
                Created {formatTimestamp(row.created_at)}
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

function Label({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      <Icon size={11} strokeWidth={1.75} />
      {children}
    </p>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label icon={icon}>{label}</Label>
      {children}
    </div>
  );
}

function PanelSelect({
  value,
  onChange,
  options,
  leadingDot,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  leadingDot?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center rounded-lg border border-border bg-card pl-3 pr-1 transition focus-within:border-foreground/40">
      {leadingDot && <span className="mr-2">{leadingDot}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent py-2 pr-6 text-sm text-foreground capitalize outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.75}
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
