"use client";

import { useState } from "react";
import { Pencil, Trash2, ListTodo } from "lucide-react";
import { EditProjectDialog } from "@/components/shared/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/shared/DeleteProjectDialog";

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  taskCount: number;
}

export function ProjectsList({ projects }: { projects: ProjectListItem[] }) {
  const [editing, setEditing] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState<ProjectListItem | null>(null);

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {projects.map((project) => (
          <li
            key={project.id}
            className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/30"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: project.color ?? "oklch(0.7 0 0)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {project.name}
              </p>
              {project.description && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>

            <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground sm:inline-flex">
              <ListTodo size={12} strokeWidth={1.75} />
              {project.taskCount}
            </span>

            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100 md:focus-within:opacity-100">
              <button
                onClick={() => setEditing(project)}
                aria-label={`Edit ${project.name}`}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Pencil size={15} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setDeleting(project)}
                aria-label={`Delete ${project.name}`}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-danger-muted hover:text-danger"
              >
                <Trash2 size={15} strokeWidth={1.75} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <EditProjectDialog project={editing} onClose={() => setEditing(null)} />
      <DeleteProjectDialog
        project={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
