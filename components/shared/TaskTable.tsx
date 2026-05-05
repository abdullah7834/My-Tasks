"use client";

import { useMemo, useState } from "react";
import { Copy, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

interface ProjectOption {
  id: string;
  name: string;
  icon: string;
}

interface TaskRow {
  id: string;
  title: string;
  project_id: string;
  status: string;
  priority: string;
  due_date: Date | null;
  isNew?: boolean;
}

interface TaskTableProps {
  initialTasks: TaskRow[];
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

const makeTempId = () => `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function TaskTable({ initialTasks, projects }: TaskTableProps) {
  const [rows, setRows] = useState<TaskRow[]>(
    initialTasks.map((task) => ({ ...task, due_date: task.due_date ? new Date(task.due_date) : null, isNew: false })),
  );
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const addEmptyRow = () => {
    setRows((current) => [
      {
        id: makeTempId(),
        title: "",
        project_id: projects[0]?.id ?? "",
        status: "not_started",
        priority: "none",
        due_date: null,
        isNew: true,
      },
      ...current,
    ]);
  };

  const duplicateRow = (row: TaskRow) => {
    setRows((current) => [
      {
        ...row,
        id: makeTempId(),
        title: `${row.title} copy`,
        isNew: true,
      },
      ...current,
    ]);
  };

  const updateField = (id: string, field: keyof TaskRow, value: any) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const saveRow = async (row: TaskRow) => {
    if (!row.title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    const payload = {
      ...(row.isNew ? {} : { id: row.id }),
      title: row.title.trim(),
      project_id: row.project_id,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
    } as Record<string, unknown>;

    setSavingRowId(row.id);

    try {
      const method = row.isNew ? "POST" : "PATCH";
      const response = await fetch("/api/tasks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Unable to save task.");
        return;
      }

      const savedTask = result.task as TaskRow;
      setRows((current) =>
        current.map((currentRow) =>
          currentRow.id === row.id
            ? { ...savedTask, isNew: false }
            : currentRow,
        ),
      );
      toast.success("Task saved");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save task.");
    } finally {
      setSavingRowId(null);
    }
  };

  const deleteRow = async (row: TaskRow) => {
    if (row.isNew) {
      setRows((current) => current.filter((r) => r.id !== row.id));
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${row.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Unable to delete task.");
        return;
      }

      setRows((current) => current.filter((r) => r.id !== row.id));
      toast.success("Task deleted");
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete task.");
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Task table</h2>
          <p className="mt-1 text-sm text-slate-400">Edit tasks inline just like Notion.</p>
        </div>
        <button
          type="button"
          onClick={addEmptyRow}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          <Plus size={18} />
          Add row
        </button>
      </div>

      <div className="space-y-2 overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-[2.5fr_1.2fr_1.2fr_1fr_1fr_0.8fr] gap-2 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-xs uppercase tracking-[0.25em] text-slate-500">
          <div>Task</div>
          <div>Project</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Due date</div>
          <div className="text-right">Actions</div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 px-6 py-12 text-center text-slate-400">
            No tasks yet. Add a new row to start tracking your work.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid min-w-[840px] grid-cols-[2.5fr_1.2fr_1.2fr_1fr_1fr_0.8fr] gap-2 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-100"
            >
              <div>
                <input
                  value={row.title}
                  onChange={(event) => updateField(row.id, "title", event.target.value)}
                  placeholder="Task title"
                  className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <div>
                <select
                  value={row.project_id}
                  onChange={(event) => updateField(row.id, "project_id", event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.icon} {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={row.status}
                  onChange={(event) => updateField(row.id, "status", event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={row.priority}
                  onChange={(event) => updateField(row.id, "priority", event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <DatePicker
                  selected={row.due_date}
                  onChange={(date: Date | null) => updateField(row.id, "due_date", date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Due date"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => duplicateRow(row)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 transition hover:bg-slate-900"
                >
                  <Copy size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteRow(row)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-700 bg-red-950 px-3 py-2 text-red-200 transition hover:bg-red-900"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => saveRow(row)}
                  disabled={savingRowId === row.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {savingRowId === row.id ? "Saving" : "Save"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
