"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight, Inbox } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  tasks: Task[];
  projects: Project[];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-danger-muted text-danger border-transparent",
  medium: "bg-warning-muted text-warning-foreground border-transparent",
  low: "bg-info-muted text-info border-transparent",
};

function formatDue(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return { label: "Today", overdue: false };
  if (diff === 1) return { label: "Tomorrow", overdue: false };
  if (diff === -1) return { label: "Yesterday", overdue: true };
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff < 7) return { label: `In ${diff}d`, overdue: false };
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
  };
}

export default function RecentTasks({ tasks: initial, projects }: Props) {
  const [tasks, setTasks] = useState(initial);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const completeTask = async (id: string) => {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== id));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "done" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marked complete");
    } catch {
      setTasks(prev);
      toast.error("Could not update task");
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            Active tasks
          </h2>
          <p className="text-xs text-muted-foreground">
            What you're working on right now.
          </p>
        </div>
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          View all
          <ArrowUpRight size={14} strokeWidth={1.75} />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <Inbox
            size={28}
            strokeWidth={1.5}
            className="mx-auto text-muted-foreground/60"
          />
          <p className="mt-3 text-sm font-medium text-foreground">All clear.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing waiting. Add a task to get started.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {tasks.map((task) => {
            const project = projectMap.get(task.project_id);
            const due = task.due_date ? formatDue(task.due_date) : null;
            return (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-muted/40"
              >
                <button
                  onClick={() => completeTask(task.id)}
                  aria-label="Mark complete"
                  className="grid size-5 shrink-0 place-items-center rounded-full border border-border text-transparent transition hover:border-success hover:bg-success/10 hover:text-success"
                >
                  <CheckCircle2 size={14} strokeWidth={2} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {project && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-1.5 rounded-full"
                          style={{
                            background: project.color ?? "oklch(0.7 0 0)",
                          }}
                        />
                        {project.name}
                      </span>
                    )}
                    {due && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span
                          className={
                            due.overdue
                              ? "font-medium text-danger"
                              : "text-muted-foreground"
                          }
                        >
                          {due.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {task.priority !== "none" && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                      PRIORITY_STYLES[task.priority] ??
                      "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {task.priority}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
