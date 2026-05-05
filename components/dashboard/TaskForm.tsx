"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ProjectOption {
  id: string;
  name: string;
  color: string | null;
}

type FormData = {
  title: string;
  project_id: string;
  due_date: string;
  priority: "none" | "low" | "medium" | "high";
};

const PRIORITIES: FormData["priority"][] = ["none", "low", "medium", "high"];

export default function TaskForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { priority: "none", project_id: projects[0]?.id ?? "" },
  });

  const onSubmit = async (data: FormData) => {
    if (!data.project_id) {
      toast.error("Pick a project first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          project_id: data.project_id,
          due_date: data.due_date || null,
          priority: data.priority,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not save task");
      }
      toast.success("Task added");
      reset({
        title: "",
        priority: "none",
        due_date: "",
        project_id: data.project_id,
      });
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save task");
    } finally {
      setSubmitting(false);
    }
  };

  if (projects.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          Quick add
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a project to start tracking tasks.
        </p>
        <Link
          href="/dashboard/tasks"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          <Plus size={14} strokeWidth={1.75} /> New project
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          Quick add
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          New task
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        <div className="space-y-1">
          <input
            {...register("title", { required: true })}
            placeholder="What needs doing?"
            disabled={submitting}
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-foreground/40"
          />
          {errors.title && (
            <p className="text-xs text-danger">A title is required.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            {...register("project_id")}
            disabled={submitting}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/40"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            {...register("due_date")}
            type="date"
            disabled={submitting}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/40"
          />
        </div>

        <fieldset className="grid grid-cols-4 gap-1.5">
          {PRIORITIES.map((p) => (
            <label key={p} className="cursor-pointer">
              <input
                type="radio"
                value={p}
                {...register("priority")}
                className="peer sr-only"
                disabled={submitting}
              />
              <span className="block rounded-lg border border-border bg-card py-1.5 text-center text-xs font-medium capitalize text-muted-foreground transition hover:border-foreground/30 peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background">
                {p === "none" ? "—" : p}
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90 active:translate-y-px disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} strokeWidth={2} />
          )}
          Add task
        </button>
      </form>
    </section>
  );
}
